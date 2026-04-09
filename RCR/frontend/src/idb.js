// src/idb.js
import { openDB } from 'idb';

const DB_NAME = 'RapidCrisisPWA';
const REPORT_STORE = 'offlineReports';
const TASK_STORE = 'cachedTasks';

export async function getDB() {
    return openDB(DB_NAME, 2, {
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
        },
    });
}

// Reports Logic
export async function queueReport(report) {
    const db = await getDB();
    await db.put(REPORT_STORE, {...report, synced: false, createdAt: new Date() });
}

export async function getPendingReports() {
    const db = await getDB();
    return db.getAllFromIndex(REPORT_STORE, 'synced', false);
}

export async function markReportSynced(localId) {
    const db = await getDB();
    await db.delete(REPORT_STORE, localId);
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