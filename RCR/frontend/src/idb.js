// src/idb.js
import { openDB } from 'idb';

const DB_NAME = 'RapidCrisisPWA';
const STORE_NAME = 'offlineReports';

export async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'localId',
                    autoIncrement: true,
                });
                store.createIndex('synced', 'synced', { unique: false });
            }
        },
    });
}

// Save a report while offline
export async function queueReport(report) {
    const db = await getDB();
    await db.put(STORE_NAME, {...report, synced: false, createdAt: new Date() });
}

// Get all reports that have not yet been sent
export async function getPendingReports() {
    const db = await getDB();
    return db.getAllFromIndex(STORE_NAME, 'synced', false);
}

// Mark a pending record as synced (or delete it)
export async function markReportSynced(localId) {
    const db = await getDB();
    await db.delete(STORE_NAME, localId);
}