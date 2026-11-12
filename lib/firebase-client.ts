import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim(),
  authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '').trim(),
  projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim(),
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '').trim(),
  messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
  appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '').trim(),
}

let app: FirebaseApp | null = null
let auth: Auth | null = null

export function getFirebaseApp(): FirebaseApp {
  if (app) return app
  const existing = getApps()
  app = existing.length > 0 ? existing[0]! : initializeApp(firebaseConfig)
  return app
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth
  auth = getAuth(getFirebaseApp())
  return auth
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId)
}
