import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase-client'
import { firebaseVerify } from './auth-api'

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
])

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    const credential = await signInWithPopup(auth, provider)
    const idToken = await credential.user.getIdToken()
    return firebaseVerify(idToken)
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code && POPUP_FALLBACK_CODES.has(code)) {
      await signInWithRedirect(auth, provider)
      return null
    }
    throw err
  }
}

export async function completeGoogleRedirect() {
  const auth = getFirebaseAuth()
  const result = await getRedirectResult(auth)
  if (!result) return null
  const idToken = await result.user.getIdToken()
  return firebaseVerify(idToken)
}
