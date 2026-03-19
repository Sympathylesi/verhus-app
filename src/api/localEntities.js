// IndexedDB-backed entity store — no localStorage quota limits.
// Mirrors the base44 SDK entity API: list, filter, get, create, update, delete.

const DB_NAME = 'verhus_db';
const DB_VERSION = 2;
const STORES = ['WeeklyEntry', 'HealthArea', 'District', 'Alert'];

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      });
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror  = (e) => reject(e.target.error);
  });
}

function tx(storeName, mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  }));
}

function getAll(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, 'readonly');
    const req = t.objectStore(storeName).getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  }));
}

function putAll(storeName, rows) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, 'readwrite');
    const store = t.objectStore(storeName);
    rows.forEach(r => store.put(r));
    t.oncomplete = () => resolve();
    t.onerror    = (e) => reject(e.target.error);
  }));
}

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function makeEntityStore(name) {
  return {
    list:   ()        => getAll(name),
    filter: (pred={}) => getAll(name).then(rows =>
      rows.filter(r => Object.entries(pred).every(([k,v]) => r[k] === v))
    ),
    get:    (id)      => tx(name, 'readonly',  s => s.get(id)),
    create: (data)    => {
      const row = { ...data, id: genId(), createdAt: new Date().toISOString() };
      return tx(name, 'readwrite', s => s.put(row)).then(() => row);
    },
    update: (id, data) =>
      tx(name, 'readonly', s => s.get(id)).then(existing => {
        if (!existing) throw new Error(`${name} ${id} not found`);
        const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
        return tx(name, 'readwrite', s => s.put(updated)).then(() => updated);
      }),
    delete: (id) => tx(name, 'readwrite', s => s.delete(id)).then(() => ({ id })),
  };
}

// ─── Seed ────────────────────────────────────────────────────────────────────
const SEED_KEY = 'verhus_idb_seeded_v3';

const VACCINES = ['BCG','OPV0','OPV1','OPV2','OPV3','IPV1','IPV2',
  'Penta1','Penta2','Penta3','PCV1','PCV2','PCV3','Rota1','Rota2',
  'MCV1','MCV2','Yellow Fever','Vitamin A','HPV'];
const AGE_SEX  = ['0_11m_male','0_11m_female','12_23m_male','12_23m_female','24_59m_male','24_59m_female'];
const STRATEGIES = ['Fixed','Mobile','Outreach','Door-to-Door'];
const STATUSES   = ['draft','submitted','approved','rejected'];

const REGIONS = [
  { name: 'Adamaoua',     districts: ['Ngaoundéré','Vina'] },
  { name: 'Centre',       districts: ['Mfoundi','Mbam'] },
  { name: 'Est',          districts: ['Kadey','Lom-et-Djérem'] },
  { name: 'Extrême-Nord', districts: ['Diamaré','Mayo-Kani'] },
  { name: 'Littoral',     districts: ['Wouri','Moungo'] },
  { name: 'Nord',         districts: ['Bénoué','Faro'] },
  { name: 'Nord-Ouest',   districts: ['Mezam','Momo'] },
  { name: 'Ouest',        districts: ['Mifi','Noun'] },
  { name: 'Sud',          districts: ['Dja-et-Lobo','Mvila'] },
  { name: 'Sud-Ouest',    districts: ['Fako','Kupe-Manenguba'] },
];

const r  = (max=30) => Math.floor(Math.random() * max);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

async function seedDemoData() {
  if (localStorage.getItem(SEED_KEY)) return;

  const districts  = [];
  const healthAreas = [];
  const entries    = [];

  let haCounter = 0;

  REGIONS.forEach(({ name: region, districts: dNames }) => {
    dNames.forEach(dName => {
      const dId = genId();
      districts.push({ id: dId, name: dName, region });

      // 3 health areas per district
      for (let ai = 0; ai < 3; ai++) {
        const haId   = genId();
        const haName = `${dName} HA-${++haCounter}`;
        healthAreas.push({
          id: haId, name: haName, districtId: dId,
          district: dName, region,
          population0_11m:  200 + r(300),
          population12_23m: 180 + r(250),
          population24_59m: 400 + r(500),
        });

        // ~26 weeks per area across 2 years (every other week)
        [2023, 2024].forEach(year => {
          for (let wk = 1; wk <= 52; wk += 2) {
            const vaccine_doses = {};
            VACCINES.forEach(v => {
              vaccine_doses[v] = {};
              AGE_SEX.forEach(k => { vaccine_doses[v][k] = r(25); });
            });

            const dtp3 = AGE_SEX.reduce((s,k) => s + (vaccine_doses['Penta3'][k]||0), 0);
            const mcv2 = AGE_SEX.reduce((s,k) => s + (vaccine_doses['MCV2'][k]||0), 0);
            const totalDoses = VACCINES.reduce((s,v) =>
              s + AGE_SEX.reduce((ss,k) => ss + (vaccine_doses[v][k]||0), 0), 0);
            const totalChildren = 20 + r(80);

            entries.push({
              id: genId(), year, week_number: wk,
              region, district: dName,
              health_area_id: haId, health_area_name: haName,
              community: `Community ${ai+1}`,
              strategy: pick(STRATEGIES),
              status:   pick(STATUSES),
              vaccine_doses,
              vaccination_sessions: {
                mobile:       Object.fromEntries(AGE_SEX.map(k=>[k,r(20)])),
                outreach:     Object.fromEntries(AGE_SEX.map(k=>[k,r(15)])),
                fixed:        Object.fromEntries(AGE_SEX.map(k=>[k,r(25)])),
                door_to_door: Object.fromEntries(AGE_SEX.map(k=>[k,r(10)])),
              },
              community_engagement: {
                religious:   { count: r(10), level: 'informative' },
                community:   { count: r(15), level: 'consultative' },
                traditional: { count: r(8),  level: 'collaborative' },
              },
              screening: {
                sam_male_0_11: r(), sam_female_0_11: r(),
                sam_male_12_23: r(), sam_female_12_23: r(),
                mam_male_0_11: r(), mam_female_0_11: r(),
                mam_male_12_23: r(), mam_female_12_23: r(),
                disability_count: r(5), adverse_events: r(3),
                stock_out: Math.random() > 0.85,
                fridge_functional: Math.random() > 0.1,
              },
              humanitarian_items: {
                mosquito_nets: r(50), vitamin_a_supp: r(40),
                deworming: r(30), soap: r(20),
              },
              total_children_vaccinated: totalChildren,
              total_doses_administered:  totalDoses,
              dtp3_count: dtp3, mcv2_count: mcv2,
              createdAt: new Date(year, 0, wk * 7).toISOString(),
            });
          }
        });
      }
    });
  });

  await putAll('District',    districts);
  await putAll('HealthArea',  healthAreas);
  await putAll('WeeklyEntry', entries);
  await putAll('Alert',       []);

  localStorage.setItem(SEED_KEY, '1');
  console.info(`[VERHUS] Seeded ${entries.length} entries, ${healthAreas.length} health areas (IndexedDB)`);
}

export const localEntities = {
  WeeklyEntry: makeEntityStore('WeeklyEntry'),
  HealthArea:  makeEntityStore('HealthArea'),
  District:    makeEntityStore('District'),
  Alert:       makeEntityStore('Alert'),
  seedDemoData,
};
