import { appParams } from '@/lib/app-params';
import { localEntities } from './localEntities';

// Seed demo data on first load (async, no-op if already seeded)
export const seedReady = localEntities.seedDemoData().catch(e => console.warn('[VERHUS] Seed error:', e));

const hasBackend = Boolean(appParams.appId && appParams.appId !== 'null');

let _sdk = null;

async function getSDK() {
  if (_sdk) return _sdk;
  const { createClient } = await import('@base44/sdk');
  _sdk = createClient({
    appId: appParams.appId,
    token: appParams.token,
    functionsVersion: appParams.functionsVersion,
    serverUrl: '',
    requiresAuth: false,
    appBaseUrl: appParams.appBaseUrl,
  });
  return _sdk;
}

// Proxy that routes to SDK or local store depending on configuration
function makeProxy(entityName) {
  const local = localEntities[entityName];

  const call = async (method, ...args) => {
    if (!hasBackend) {
      await seedReady;
      if (!local) throw new Error(`No local store for entity: ${entityName}`);
      return local[method](...args);
    }
    try {
      const sdk = await getSDK();
      return await sdk.entities[entityName][method](...args);
    } catch (err) {
      // If the backend is unreachable, fall back to local store silently
      if (local && (err?.response?.status === 404 || err?.code === 'ERR_NETWORK')) {
        console.warn(`[VERHUS] Backend unavailable for ${entityName}.${method}, using local store`);
        return local[method](...args);
      }
      throw err;
    }
  };

  return {
    list:   (...a) => call('list',   ...a),
    filter: (...a) => call('filter', ...a),
    get:    (...a) => call('get',    ...a),
    create: (...a) => call('create', ...a),
    update: (...a) => call('update', ...a),
    delete: (...a) => call('delete', ...a),
  };
}

export const base44 = {
  entities: {
    WeeklyEntry: makeProxy('WeeklyEntry'),
    HealthArea:  makeProxy('HealthArea'),
    District:    makeProxy('District'),
    Alert:       makeProxy('Alert'),
  },
  // Expose auth passthrough for logout calls in Settings
  auth: {
    logout: () => {
      if (hasBackend) {
        getSDK().then(sdk => sdk.auth?.logout?.()).catch(() => {});
      }
    },
  },
  isLocal: !hasBackend,
};
