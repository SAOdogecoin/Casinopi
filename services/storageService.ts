
import { CustomAssetMap } from '../types';

const DB_NAME = 'jw_game_db';
const STORE_NAME = 'assets_store';
const KEY = 'custom_assets';

export const saveAssetsToDB = (assets: CustomAssetMap): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.warn("IndexedDB not supported");
            return resolve();
        }

        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // We clone the object to ensure it's structured cloneable (remove any non-serializable data if any)
            try {
                const putRequest = store.put(JSON.parse(JSON.stringify(assets)), KEY);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = (e) => {
                    console.error("Failed to save assets to DB", e);
                    reject('Failed to save assets');
                };
            } catch (e) {
                console.error("Error saving assets", e);
                reject(e);
            }
        };

        request.onerror = (e) => {
            console.error("Failed to open DB", e);
            reject('Failed to open DB');
        };
    });
};

export const loadAssetsFromDB = (): Promise<CustomAssetMap> => {
    return new Promise((resolve) => {
        if (!window.indexedDB) {
            return resolve({});
        }

        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            try {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const getRequest = store.get(KEY);

                getRequest.onsuccess = () => {
                    resolve(getRequest.result || {});
                };
                getRequest.onerror = () => {
                    console.warn("Error reading from store");
                    resolve({});
                };
            } catch (e) {
                // Store might not exist yet
                resolve({});
            }
        };

        request.onerror = () => {
            console.error("IndexedDB error loading");
            resolve({});
        };
    });
};
