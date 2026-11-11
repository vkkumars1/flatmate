import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  type UserCredential,
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase-client'
import { firebaseVerify } from './auth-api'

async function finalizeCredential(credential: UserCredential) {
  const idToken = await credential.user.getIdToken()
  return firebaseVerify(idToken)
}

export async function signUpWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await sendEmailVerification(credential.user).catch(() => null)
  return finalizeCredential(credential)
}

export async function signInWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth()
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return finalizeCredential(credential)
}
