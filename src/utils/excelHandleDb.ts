export interface OpenFilePickerOptions {
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

export interface FileSystemPermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

export interface ExtendedFileSystemFileHandle extends FileSystemFileHandle {
  queryPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>;
}

declare global {
  interface Window {
    showOpenFilePicker?: (
      options?: OpenFilePickerOptions
    ) => Promise<ExtendedFileSystemFileHandle[]>;
  }
}

const DB_NAME = 'plans_finder_auto_excel_db';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const HANDLE_KEY = 'connected_excel_handle';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
}

export async function saveExcelHandle(
  handle: ExtendedFileSystemFileHandle
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(handle, HANDLE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to save file handle.'));
    tx.oncomplete = () => db.close();
  });
}

export async function loadExcelHandle(): Promise<ExtendedFileSystemFileHandle | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(HANDLE_KEY);
    req.onsuccess = () =>
      resolve((req.result as ExtendedFileSystemFileHandle | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error('Failed to load file handle.'));
    tx.oncomplete = () => db.close();
  });
}

export async function clearExcelHandle(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(HANDLE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to clear file handle.'));
    tx.oncomplete = () => db.close();
  });
}

export async function checkExcelPermission(
  handle: ExtendedFileSystemFileHandle
): Promise<PermissionState> {
  if (typeof handle.queryPermission === 'function') {
    return handle.queryPermission({ mode: 'readwrite' });
  }
  return 'granted';
}

export async function requestExcelPermission(
  handle: ExtendedFileSystemFileHandle
): Promise<boolean> {
  const current = await checkExcelPermission(handle);
  if (current === 'granted') return true;
  if (typeof handle.requestPermission === 'function') {
    const result = await handle.requestPermission({ mode: 'readwrite' });
    return result === 'granted';
  }
  return false;
}
