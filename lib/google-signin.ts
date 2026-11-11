import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirebaseAuth } from './firebase-client'
import { firebaseVerify } from './auth-api'

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await signInWithPopup(auth, provider)
  const idToken = await credential.user.getIdToken()
  return firebaseVerify(idToken)
}
