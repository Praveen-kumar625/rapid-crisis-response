const DB_NAME = 'RapidCrisisPWA';
const STORE_NAME = 'offlineReports';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'localId', autoIncrement: true });
                store.createIndex('synced', 'synced', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getPendingReports() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('synced');
        const req = index.getAll(false);

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function deleteReport(localId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(localId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function syncReports() {
    const reports = await getPendingReports();

    for (const rpt of reports) {
        try {
            const res = await fetch('/incidents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: rpt.title,
                    description: rpt.description,
                    severity: rpt.severity,
                    category: rpt.category,
                    lng: rpt.lng,
                    lat: rpt.lat,
                    mediaType: rpt.mediaType,
                    mediaBase64: rpt.mediaBase64,
                }),
            });

            if (res.ok || res.status === 202) {
                await deleteReport(rpt.localId);
            } else {
                throw new Error('Sync failed ' + res.status);
            }
        } catch (err) {
            console.error('[ServiceWorker] syncReports failed:', err);
            if (self.registration.showNotification) {
                self.registration.showNotification('Crisis sync failed', {
                    body: 'Unable to send queued offline reports yet; retrying soon.',
                });
            }
            throw err;
        }
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-reports') {
        event.waitUntil(syncReports());
    }
});