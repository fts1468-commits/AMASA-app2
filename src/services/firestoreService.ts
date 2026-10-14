import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Property } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the explicit databaseId provisioned in firebase-applet-config.json
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is offline or network is disconnected:', error.message);
    }
  }
})();

const PROPERTIES_COLLECTION = 'properties';

/**
 * Listen to real-time property updates from Firestore
 */
export function subscribeToProperties(
  onPropertiesUpdated: (properties: Property[]) => void
): () => void {
  try {
    const colRef = collection(db, PROPERTIES_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteProps: Property[] = [];
          snapshot.forEach((docSnap) => {
            remoteProps.push(docSnap.data() as Property);
          });
          onPropertiesUpdated(remoteProps);
        }
      },
      (error) => {
        console.warn('Firestore properties snapshot listener error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach Firestore listener:', err);
    return () => {};
  }
}

/**
 * Save or update a single property in Firestore so it activates for everyone
 */
export async function savePropertyRemote(property: Property): Promise<void> {
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, property.id);
    await setDoc(docRef, property, { merge: true });
  } catch (err) {
    console.error('Failed to save property to Firestore:', err);
  }
}

/**
 * Delete a property from Firestore
 */
export async function deletePropertyRemote(propertyId: string): Promise<void> {
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, propertyId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete property from Firestore:', err);
  }
}

/**
 * Seed initial properties to Firestore if remote collection is empty
 */
export async function seedPropertiesIfEmpty(initialProperties: Property[]): Promise<void> {
  try {
    for (const prop of initialProperties) {
      const docRef = doc(db, PROPERTIES_COLLECTION, prop.id);
      await setDoc(docRef, prop, { merge: true });
    }
  } catch (err) {
    console.warn('Could not seed initial properties to Firestore:', err);
  }
}
