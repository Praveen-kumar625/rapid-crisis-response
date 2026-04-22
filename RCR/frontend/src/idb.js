// src/idb.js
import { openDB } from 'idb';

const DB_NAME = 'RapidCrisisPWA';
const REPORT_STORE = 'offlineReports';
const TASK_STORE = 'cachedTasks';
const EXTERNAL_CACHE = 'externalCache';

export async function getDB() {
    return openDB(DB_NAME, 3, {
        upgrade(db, oldVersion, _newVersion) {
            if (oldVersion < 1) {
                if (!db.objectStoreNames.contains(REPORT_STORE)) {
                    const store = db.createObjectStore(REPORT_STORE, {
                        keyPath: 'localId',
                        autoIncrement: true,
                    });
                    store.createIndex('synced', 'synced', { unique: false });
                }
            }
            if (oldVersion < 2) {
                if (!db.objectStoreNames.contains(TASK_STORE)) {
                    db.createObjectStore(TASK_STORE, { keyPath: 'id' });
                }
            }
            if (oldVersion < 3) {
                if (!db.objectStoreNames.contains(EXTERNAL_CACHE)) {
                    db.createObjectStore(EXTERNAL_CACHE, { keyPath: 'key' });
                }
            }
        },
    });
}

// External Caching Logic
export async function cacheExternalData(key, data) {
    const db = await getDB();
    return db.put(EXTERNAL_CACHE, { key, data, timestamp: Date.now() });
}

export async function getCachedExternalData(key) {
    const db = await getDB();
    const entry = await db.get(EXTERNAL_CACHE, key);
    return entry ? entry.data : null;
}

// Reports Logic
export async function queueReport(report) {
    const db = await getDB();
    // ✅ Use 0 instead of false (IDB doesn't support boolean keys)
    await db.put(REPORT_STORE, { ...report, synced: 0, createdAt: new Date() });
}

export async function getPendingReports() {
    const db = await getDB();
    // ✅ Use 0 instead of false
    return db.getAllFromIndex(REPORT_STORE, 'synced', 0);
}

export async function markReportSynced(localId) {
    const db = await getDB();
    await db.delete(REPORT_STORE, localId);
}

export async function clearPendingReports() {
    const db = await getDB();
    await db.clear(REPORT_STORE);
}

// Tasks Caching Logic
export async function cacheTasks(tasks) {
    const db = await getDB();
    const tx = db.transaction(TASK_STORE, 'readwrite');
    await tx.store.clear();
    for (const task of tasks) {
        await tx.store.put(task);
    }
    await tx.done;
}

export async function getCachedTasks() {
    const db = await getDB();
    return db.getAll(TASK_STORE);
}