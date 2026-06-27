import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  setDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLogin: any; // Timestamp
}

export async function saveUserOnLogin(user: User) {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (user && user.email === 'kvsrihariprasad@gmail.com') return true;

  try {
    const adminSnap = await getDoc(doc(db, 'admins', userId));
    return adminSnap.exists();
  } catch (error) {
    console.warn("Check admin failed", error);
    return false;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

export interface UserSettings {
  selectedVoice: string;
  selectedMood: string;
  voiceSpeed: number;
  voicePitch: number;
  voiceAccent: string;
  isMuted: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "swara";
  text: string;
}

/**
 * Saves a message to Firestore
 */
export async function saveMessage(sender: "user" | "swara", text: string) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, 'messages'), {
      userId: user.uid,
      sender,
      text,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'messages');
  }
}

/**
 * Subscribes to chat messages for the current user
 */
export function subscribeToMessages(user: User, callback: (messages: ChatMessage[]) => void) {
  if (!user) return () => {};

  const q = query(
    collection(db, 'messages'),
    where('userId', '==', user.uid)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data({ serverTimestamps: 'estimate' })
    } as ChatMessage));
    
    // Sort locally
    messages.sort((a, b) => {
      const timeA = (a as any).createdAt?.toMillis?.() || 0;
      const timeB = (b as any).createdAt?.toMillis?.() || 0;
      return timeA - timeB;
    });
    
    callback(messages);
  }, (error) => {
    // If not signed in anymore, ignore the error
    if (!auth.currentUser) {
      console.warn("Message subscription interrupted by logout");
      return;
    }
    handleFirestoreError(error, OperationType.LIST, 'messages');
  });
}

/**
 * Saves user settings to Firestore
 */
export async function saveUserSettings(settings: UserSettings) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await setDoc(doc(db, 'userSettings', user.uid), {
      userId: user.uid,
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `userSettings/${user.uid}`);
  }
}

/**
 * Loads user settings from Firestore
 */
export async function loadUserSettings(): Promise<UserSettings | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, 'userSettings', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `userSettings/${user.uid}`);
  }
  return null;
}

/**
 * Wipes all messages for the current user
 */
export async function wipeHistory() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const q = query(collection(db, 'messages'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'messages');
  }
}
