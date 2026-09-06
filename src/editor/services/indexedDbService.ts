import { EditorElement, PdfDocumentInfo } from '../types/editorTypes';

const DB_NAME = 'pdftool_editor_db';
const DB_VERSION = 1;
const STORE_NAME = 'saved_sessions';

export interface SavedSession {
  id: string;
  name: string;
  pdfData: ArrayBuffer | null;
  elements: EditorElement[];
  rotations: Record<number, number>;
  pageCount: number;
  lastModified: number;
  thumbnail?: string;
}

class IndexedDbService {
  private static instance: IndexedDbService;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private constructor() {}

  public static getInstance(): IndexedDbService {
    if (!IndexedDbService.instance) {
      IndexedDbService.instance = new IndexedDbService();
    }
    return IndexedDbService.instance;
  }

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        console.warn('[IndexedDbService] Could not open IndexedDB:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  public async saveSession(session: SavedSession): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(session);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[IndexedDbService] saveSession error:', err);
    }
  }

  public async getLatestSession(): Promise<SavedSession | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const all: SavedSession[] = req.result || [];
          if (all.length === 0) {
            resolve(null);
          } else {
            all.sort((a, b) => b.lastModified - a.lastModified);
            resolve(all[0]);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[IndexedDbService] getLatestSession error:', err);
      return null;
    }
  }

  public async clearSession(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[IndexedDbService] clearSession error:', err);
    }
  }
}

export const indexedDbService = IndexedDbService.getInstance();
