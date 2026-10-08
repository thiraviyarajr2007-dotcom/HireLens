import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const TMP_STORE_FILE = path.join(DATA_DIR, 'store.json.tmp');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STORAGE_MODE = process.env.STORAGE || 'local';

// In-process mutex for local storage atomic concurrency protection
class Mutex {
  constructor() {
    this._queue = Promise.resolve();
  }
  lock(fn) {
    const result = this._queue.then(() => fn());
    this._queue = result.catch(() => {});
    return result;
  }
}

const fileMutex = new Mutex();

function getInitialStore() {
  return {
    candidates: [],
    jobs: [],
    evaluations: [],
    auditLogs: [],
    history: [],
    users: []
  };
}

/**
 * Load raw local store JSON
 */
export function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        candidates: parsed.candidates || [],
        jobs: parsed.jobs || [],
        evaluations: parsed.evaluations || [],
        auditLogs: parsed.auditLogs || [],
        history: parsed.history || [],
        users: parsed.users || []
      };
    }
  } catch (err) {
    console.error('Error loading store.json:', err);
  }
  const initial = getInitialStore();
  saveStore(initial);
  return initial;
}

/**
 * Atomic file write with tmp rename and mutex
 */
export function saveStore(store) {
  try {
    const payload = JSON.stringify(store, null, 2);
    fs.writeFileSync(TMP_STORE_FILE, payload, 'utf-8');
    fs.renameSync(TMP_STORE_FILE, STORE_FILE);
  } catch (err) {
    console.error('Error saving store.json atomically:', err);
  }
}

export async function saveStoreAsync(store) {
  return fileMutex.lock(async () => {
    saveStore(store);
  });
}

/**
 * Repository Abstraction: candidates
 */
export async function getCandidates(ownerUid) {
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    const snapshot = await db.collection('candidates').where('ownerUid', '==', ownerUid).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  const store = loadStore();
  return store.candidates.filter(c => !ownerUid || c.ownerUid === ownerUid || !c.ownerUid);
}

export async function getCandidateById(id, ownerUid) {
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    const doc = await db.collection('candidates').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (ownerUid && data.ownerUid && data.ownerUid !== ownerUid) return null;
    return { id: doc.id, ...data };
  }
  const store = loadStore();
  return store.candidates.find(c => c.id === id && (!ownerUid || c.ownerUid === ownerUid || !c.ownerUid)) || null;
}

export async function saveCandidate(candidate, ownerUid) {
  const item = { ...candidate, ownerUid: ownerUid || candidate.ownerUid || 'demo_user_recruiter_001', updatedAt: new Date().toISOString() };
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    await db.collection('candidates').doc(item.id).set(item, { merge: true });
    return item;
  }
  return fileMutex.lock(async () => {
    const store = loadStore();
    const idx = store.candidates.findIndex(c => c.id === item.id);
    if (idx >= 0) {
      store.candidates[idx] = { ...store.candidates[idx], ...item };
    } else {
      store.candidates.unshift(item);
    }
    saveStore(store);
    return item;
  });
}

/**
 * Repository Abstraction: jobs
 */
export async function getJobs(ownerUid) {
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    const snapshot = await db.collection('jobs').where('ownerUid', '==', ownerUid).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  const store = loadStore();
  return store.jobs.filter(j => !ownerUid || j.ownerUid === ownerUid || !j.ownerUid);
}

export async function getJobById(id, ownerUid) {
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    const doc = await db.collection('jobs').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (ownerUid && data.ownerUid && data.ownerUid !== ownerUid) return null;
    return { id: doc.id, ...data };
  }
  const store = loadStore();
  return store.jobs.find(j => j.id === id && (!ownerUid || j.ownerUid === ownerUid || !j.ownerUid)) || null;
}

export async function saveJob(job, ownerUid) {
  const item = { ...job, ownerUid: ownerUid || job.ownerUid || 'demo_user_recruiter_001', updatedAt: new Date().toISOString() };
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    await db.collection('jobs').doc(item.id).set(item, { merge: true });
    return item;
  }
  return fileMutex.lock(async () => {
    const store = loadStore();
    const idx = store.jobs.findIndex(j => j.id === item.id);
    if (idx >= 0) {
      store.jobs[idx] = { ...store.jobs[idx], ...item };
    } else {
      store.jobs.unshift(item);
    }
    saveStore(store);
    return item;
  });
}

/**
 * Repository Abstraction: evaluations
 */
export async function getEvaluations(ownerUid, { candidateId, jobId } = {}) {
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    let q = db.collection('evaluations').where('ownerUid', '==', ownerUid);
    if (candidateId) q = q.where('candidateId', '==', candidateId);
    if (jobId) q = q.where('jobId', '==', jobId);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  const store = loadStore();
  return store.evaluations.filter(e => {
    if (ownerUid && e.ownerUid && e.ownerUid !== ownerUid) return false;
    if (candidateId && e.candidateId !== candidateId) return false;
    if (jobId && e.jobId !== jobId) return false;
    return true;
  });
}

export async function saveEvaluation(evaluation, ownerUid) {
  const item = { ...evaluation, ownerUid: ownerUid || evaluation.ownerUid || 'demo_user_recruiter_001', updatedAt: new Date().toISOString() };
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    await db.collection('evaluations').doc(item.id).set(item, { merge: true });
    return item;
  }
  return fileMutex.lock(async () => {
    const store = loadStore();
    const idx = store.evaluations.findIndex(e => e.id === item.id);
    if (idx >= 0) {
      store.evaluations[idx] = { ...store.evaluations[idx], ...item };
    } else {
      store.evaluations.unshift(item);
    }
    saveStore(store);
    return item;
  });
}

/**
 * Repository Abstraction: auditLogs (immutable append)
 */
export async function getAuditLogs(ownerUid, { candidateId, evaluationId } = {}) {
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    let q = db.collection('auditLogs').where('ownerUid', '==', ownerUid);
    if (candidateId) q = q.where('candidateId', '==', candidateId);
    if (evaluationId) q = q.where('evaluationId', '==', evaluationId);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  const store = loadStore();
  return store.auditLogs.filter(a => {
    if (ownerUid && a.ownerUid && a.ownerUid !== ownerUid) return false;
    if (candidateId && a.candidateId !== candidateId) return false;
    if (evaluationId && a.evaluationId !== evaluationId) return false;
    return true;
  });
}

export async function saveAuditLog(log, ownerUid) {
  const item = { ...log, ownerUid: ownerUid || log.ownerUid || 'demo_user_recruiter_001', loggedAt: new Date().toISOString() };
  if (STORAGE_MODE === 'firestore' && admin.apps.length > 0) {
    const db = admin.firestore();
    await db.collection('auditLogs').doc(item.id || `log_${Date.now()}`).set(item);
    return item;
  }
  return fileMutex.lock(async () => {
    const store = loadStore();
    store.auditLogs.unshift(item);
    saveStore(store);
    return item;
  });
}

/**
 * Repository Abstraction: history
 */
export async function getHistory(ownerUid) {
  const store = loadStore();
  return store.history.filter(h => !ownerUid || h.ownerUid === ownerUid || !h.ownerUid);
}

export async function saveHistory(historyItem, ownerUid) {
  const item = { ...historyItem, ownerUid: ownerUid || historyItem.ownerUid || 'demo_user_recruiter_001', createdAt: new Date().toISOString() };
  return fileMutex.lock(async () => {
    const store = loadStore();
    store.history.unshift(item);
    saveStore(store);
    return item;
  });
}
