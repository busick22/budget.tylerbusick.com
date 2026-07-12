// One place that knows about Firebase. Everything else imports from here.
//
// The config below is safe to keep in source — it identifies the project the
// way a street address identifies a building. Access is controlled by
// Firestore rules and Auth, not by hiding these strings.
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBMkM2AhIZVowHDCeQ8vEcaeYM6UuuTau8',
  authDomain: 'busick-budget.firebaseapp.com',
  projectId: 'busick-budget',
  storageBucket: 'busick-budget.firebasestorage.app',
  messagingSenderId: '702323368586',
  appId: '1:702323368586:web:a7f149a858f743391b0373',
}

// True once the real config has been pasted in. The sign-in screen uses this
// to show a friendly "not connected yet" note instead of a confusing error.
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith('PASTE_')

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
