import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { Cafe, PlaceType } from '@/types/cafe';

/* ── Real-time listener — returns an unsubscribe fn ────────── */
export function subscribeToCafes(callback: (cafes: Cafe[]) => void): () => void {
  const q = query(collection(db, 'places'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const cafes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Cafe));
      callback(cafes);
    },
    () => callback([]) // silently fail — static cafes still show
  );
}

/* ── Upload a single photo to Firebase Storage ──────────────── */
export async function uploadPlacePhoto(file: File, slug: string): Promise<string> {
  const ext      = file.name.split('.').pop() ?? 'jpg';
  const filename = `${Date.now()}.${ext}`;
  const storageRef = ref(storage, `places/${slug}/${filename}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/* ── Fetch a single place by slug ───────────────────────────── */
export async function getPlaceBySlug(slug: string): Promise<Cafe | null> {
  const q = query(collection(db, 'places'), where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Cafe;
}

/* ── Update an existing place ───────────────────────────────── */
export async function updatePlace(
  id: string,
  data: Partial<Omit<Cafe, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, 'places', id), data as Record<string, unknown>);
}

/* ── Delete a place from Firestore ──────────────────────────── */
export async function deletePlace(id: string): Promise<void> {
  await deleteDoc(doc(db, 'places', id));
}

/* ── Seed static JSON cafes into Firestore (one-time) ───────── */
export async function seedPlaces(cafes: Cafe[]): Promise<void> {
  const batch = writeBatch(db);
  cafes.forEach((cafe) => {
    const { id: _id, ...data } = cafe as Cafe & { id: string };
    const docRef = doc(collection(db, 'places'));
    batch.set(docRef, { ...data, createdAt: serverTimestamp() });
  });
  await batch.commit();
}

/* ── Add a new place to Firestore ───────────────────────────── */
export async function addPlace(data: {
  type: PlaceType;
  name: string;
  slug: string;
  tagline: string;
  neighborhood: string;
  hours: string;
  description: string;
  vibeTags: string[];
  lat: number;
  lng: number;
  photos: string[];
}): Promise<string> {
  const docRef = await addDoc(collection(db, 'places'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
