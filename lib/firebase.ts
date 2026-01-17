import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase App과 Firestore lazy 초기화
let _app: FirebaseApp | undefined
let _db: Firestore | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    if (!firebaseConfig.apiKey) {
      throw new Error('Firebase 환경 변수가 설정되지 않았습니다')
    }
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return _app
}

export function getFirebaseDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp())
  }
  return _db
}

// 기존 코드 호환용 (클라이언트에서만 사용)
export const app = typeof window !== 'undefined' ? getFirebaseApp() : (null as unknown as FirebaseApp)
export const db = typeof window !== 'undefined' ? getFirebaseDb() : (null as unknown as Firestore)
