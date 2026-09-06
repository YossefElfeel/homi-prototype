/**
 * Pictures the office uploads, kept where they fit.
 *
 * There is no server here, so an uploaded file has to live in the browser —
 * and the obvious place is the wrong one. The Zustand store persists to
 * `localStorage`, which caps at about five megabytes for the whole origin: one
 * phone photograph as a data URL is two to five of them on its own, so the
 * first upload would not merely fail, it would blow the quota and take the
 * entire dataset with it. Every request, quote and invoice in the prototype,
 * lost to one picture of a ceiling.
 *
 * So the bytes go to IndexedDB, which is measured in hundreds of megabytes,
 * and the record keeps a key — `idb:<id>` — in the same `src` field that
 * otherwise holds a path or a URL. Three kinds of source, one field, and the
 * component that renders them is the only thing that has to know the
 * difference.
 *
 * Everything is downscaled on the way in. A portfolio page loading twenty-two
 * untouched four-megabyte originals is a slow page whatever the storage
 * allows, and a phone photograph is ten times larger than anything a 4:3 tile
 * can show.
 */

const DB = 'homivaro-images';
const STORE = 'files';
const PREFIX = 'idb:';

/** The longest edge an uploaded picture is kept at. */
const MAX_EDGE = 1600;
/** JPEG quality. 0.82 is where the artefacts stop being visible on photographs. */
const QUALITY = 0.82;

export function isUploaded(src: string) {
  return src.startsWith(PREFIX);
}

export function uploadKey(id: string) {
  return `${PREFIX}${id}`;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = run(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Shrink a picked file to something a web page should carry.
 *
 * Canvas rather than a library: the whole job is one `drawImage` into a
 * smaller box, and the alternative is a dependency for arithmetic. Anything
 * already inside the box is left alone — re-encoding a small picture only
 * loses quality.
 */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    /* No 2d context is a browser problem, not a file problem — keeping the
       original is better than refusing the upload over it. */
    return file;
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  );
  return blob ?? file;
}

export interface StoredImage {
  /** The value to put in a record's `src`. */
  src: string;
  width: number;
  height: number;
}

/** Take a file from the device, shrink it, keep it, and say what to store. */
export async function putImage(file: File): Promise<StoredImage> {
  const blob = await downscale(file);
  const bitmap = await createImageBitmap(blob);
  const id = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  await withStore('readwrite', (store) => store.put(blob, id));

  const stored = { src: uploadKey(id), width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return stored;
}

export async function getImage(src: string): Promise<Blob | undefined> {
  if (!isUploaded(src)) return undefined;
  return withStore('readonly', (store) => store.get(src.slice(PREFIX.length)));
}

/**
 * Forget an uploaded picture.
 *
 * Called when a photograph is removed, because the record going away is not
 * the file going away — and a browser store that only ever grows is the same
 * quota problem this module exists to avoid, arriving more slowly.
 */
export async function deleteImage(src: string): Promise<void> {
  if (!isUploaded(src)) return;
  await withStore('readwrite', (store) => store.delete(src.slice(PREFIX.length)));
}
