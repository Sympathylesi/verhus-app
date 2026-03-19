// Column definitions for the main historical database table.
// Each entry maps a data key → display label, group, and type.

export const VACCINES = [
  'BCG','OPV0','OPV1','OPV2','OPV3',
  'IPV1','IPV2','Penta1','Penta2','Penta3',
  'PCV1','PCV2','PCV3','Rota1','Rota2',
  'MCV1','MCV2','Yellow Fever','Vitamin A','HPV',
];

export const DOSE_AGE_SEX = [
  { key: '0_11m_male',    label: '0-11m M' },
  { key: '0_11m_female',  label: '0-11m F' },
  { key: '12_23m_male',   label: '12-23m M' },
  { key: '12_23m_female', label: '12-23m F' },
  { key: '24_59m_male',   label: '24-59m M' },
  { key: '24_59m_female', label: '24-59m F' },
  { key: 'hpv_9_13y',     label: '9-13y HPV' },
];

export const SESSION_TYPES = ['mobile','outreach','fixed','door_to_door'];
export const SESSION_AGE_SEX = [
  { key: '0_11m_male',    label: '0-11m M' },
  { key: '0_11m_female',  label: '0-11m F' },
  { key: '12_23m_male',   label: '12-23m M' },
  { key: '12_23m_female', label: '12-23m F' },
  { key: '24_59m_male',   label: '24-59m M' },
  { key: '24_59m_female', label: '24-59m F' },
];

export const ENGAGEMENT_GROUPS = ['religious','community','traditional'];
export const ENGAGEMENT_LEVELS = ['informative','consultative','collaborative'];

// ─── Flat column list ────────────────────────────────────────────────────────
// id must match the accessor path used in flattenRow()

const col = (id, header, group, numeric = false, defaultVisible = true) =>
  ({ id, header, group, numeric, defaultVisible });

export const COLUMN_DEFS = [
  // ── Identity ──────────────────────────────────────────────────────────────
  col('sn',               'S/N',           'Identity', false, true),
  col('year',             'Year',          'Identity', false, true),
  col('week_number',      'Week',          'Identity', false, true),
  col('region',           'Region',        'Identity', false, true),
  col('district',         'District',      'Identity', false, true),
  col('health_area_name', 'Health Area',   'Identity', false, true),
  col('community',        'Community',     'Identity', false, false),
  col('strategy',         'Strategy',      'Identity', false, true),
  col('status',           'Status',        'Identity', false, true),

  // ── Community Engagement ──────────────────────────────────────────────────
  ...ENGAGEMENT_GROUPS.flatMap(g => [
    col(`eng_${g}_count`, `${g[0].toUpperCase()+g.slice(1)} Leaders #`, 'Engagement', true, false),
    col(`eng_${g}_level`, `${g[0].toUpperCase()+g.slice(1)} Level`,     'Engagement', false, false),
  ]),

  // ── Humanitarian Items ────────────────────────────────────────────────────
  col('hum_mosquito_nets',  'Mosquito Nets',  'Humanitarian', true, false),
  col('hum_vitamin_a_supp', 'Vitamin A Supp', 'Humanitarian', true, false),
  col('hum_deworming',      'Deworming',      'Humanitarian', true, false),
  col('hum_soap',           'Soap',           'Humanitarian', true, false),

  // ── Screening / Malnutrition ──────────────────────────────────────────────
  col('scr_sam_male_0_11',    'SAM 0-11m M',   'Screening', true, true),
  col('scr_sam_female_0_11',  'SAM 0-11m F',   'Screening', true, true),
  col('scr_sam_male_12_23',   'SAM 12-23m M',  'Screening', true, false),
  col('scr_sam_female_12_23', 'SAM 12-23m F',  'Screening', true, false),
  col('scr_mam_male_0_11',    'MAM 0-11m M',   'Screening', true, false),
  col('scr_mam_female_0_11',  'MAM 0-11m F',   'Screening', true, false),
  col('scr_mam_male_12_23',   'MAM 12-23m M',  'Screening', true, false),
  col('scr_mam_female_12_23', 'MAM 12-23m F',  'Screening', true, false),
  col('scr_disability',       'Disability',    'Screening', true, false),
  col('scr_aefi',             'AEFI',          'Screening', true, true),
  col('scr_stock_out',        'Stock-Out',     'Screening', false, true),
  col('scr_fridge_ok',        'Fridge OK',     'Screening', false, false),

  // ── Sessions ──────────────────────────────────────────────────────────────
  ...SESSION_TYPES.flatMap(st =>
    SESSION_AGE_SEX.map(({ key, label }) =>
      col(`sess_${st}_${key}`, `${st[0].toUpperCase()+st.slice(1)} ${label}`, 'Sessions', true, false)
    )
  ),

  // ── Vaccine Doses ─────────────────────────────────────────────────────────
  ...VACCINES.flatMap(vac =>
    DOSE_AGE_SEX.map(({ key, label }) =>
      col(`dose_${vac}_${key}`, `${vac} ${label}`, `Doses – ${vac}`, true, false)
    )
  ),

  // ── Totals ────────────────────────────────────────────────────────────────
  col('total_children_vaccinated', 'Total Children', 'Totals', true, true),
  col('total_doses_administered',  'Total Doses',    'Totals', true, true),
  col('dtp3_count',                'DTP3 Total',     'Totals', true, true),
  col('mcv2_count',                'MCV2 Total',     'Totals', true, true),
];

export const COLUMN_GROUPS = [...new Set(COLUMN_DEFS.map(c => c.group))];

// ─── Flatten a raw WeeklyEntry row into the flat column space ────────────────
export function flattenRow(e, idx) {
  const row = { sn: idx + 1 };

  // Identity
  row.year             = e.year ?? '';
  row.week_number      = e.week_number ?? '';
  row.region           = e.region ?? '';
  row.district         = e.district ?? '';
  row.health_area_name = e.health_area_name ?? '';
  row.community        = e.community ?? '';
  row.strategy         = e.strategy ?? '';
  row.status           = e.status ?? '';

  // Engagement
  const eng = e.community_engagement || {};
  ENGAGEMENT_GROUPS.forEach(g => {
    row[`eng_${g}_count`] = eng[g]?.count ?? 0;
    row[`eng_${g}_level`] = eng[g]?.level ?? '';
  });

  // Humanitarian
  const hum = e.humanitarian_items || {};
  row.hum_mosquito_nets  = hum.mosquito_nets  ?? 0;
  row.hum_vitamin_a_supp = hum.vitamin_a_supp ?? 0;
  row.hum_deworming      = hum.deworming      ?? 0;
  row.hum_soap           = hum.soap           ?? 0;

  // Screening
  const scr = e.screening || {};
  row.scr_sam_male_0_11    = scr.sam_male_0_11    ?? 0;
  row.scr_sam_female_0_11  = scr.sam_female_0_11  ?? 0;
  row.scr_sam_male_12_23   = scr.sam_male_12_23   ?? 0;
  row.scr_sam_female_12_23 = scr.sam_female_12_23 ?? 0;
  row.scr_mam_male_0_11    = scr.mam_male_0_11    ?? 0;
  row.scr_mam_female_0_11  = scr.mam_female_0_11  ?? 0;
  row.scr_mam_male_12_23   = scr.mam_male_12_23   ?? 0;
  row.scr_mam_female_12_23 = scr.mam_female_12_23 ?? 0;
  row.scr_disability       = scr.disability_count ?? 0;
  row.scr_aefi             = scr.adverse_events   ?? 0;
  row.scr_stock_out        = scr.stock_out ? 'Yes' : 'No';
  row.scr_fridge_ok        = scr.fridge_functional !== false ? 'Yes' : 'No';

  // Sessions
  const sess = e.vaccination_sessions || {};
  SESSION_TYPES.forEach(st => {
    SESSION_AGE_SEX.forEach(({ key }) => {
      row[`sess_${st}_${key}`] = sess[st]?.[key] ?? 0;
    });
  });

  // Doses
  const doses = e.vaccine_doses || {};
  VACCINES.forEach(vac => {
    DOSE_AGE_SEX.forEach(({ key }) => {
      row[`dose_${vac}_${key}`] = doses[vac]?.[key] ?? 0;
    });
  });

  // Totals
  row.total_children_vaccinated = e.total_children_vaccinated ?? 0;
  row.total_doses_administered  = e.total_doses_administered  ?? 0;
  row.dtp3_count                = e.dtp3_count  ?? 0;
  row.mcv2_count                = e.mcv2_count  ?? 0;

  return row;
}
