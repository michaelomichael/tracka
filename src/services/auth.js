import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  signOut as fbSignOut,
} from 'firebase/auth'
//import { Capacitor } from '@capacitor/core'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { useLogger } from './logger'
import { Capacitor } from '@capacitor/core'

const { log, warn } = useLogger('auth.js')

// Will come from .env.local
const WEB_CLIENT_ID = import.meta.env['VITE_GOOGLE_AUTH_WEB_CLIENT_ID']

let isSocialLoginInitialized = false

export async function signInWithGoogle() {
  const platform = Capacitor.getPlatform()
  log(
    'signInWithGoogle called. Platform is: ',
    platform,
    'and isNative is: ',
    Capacitor.isNativePlatform(),
  )

  // NATIVE login for iOS or Android
  if (platform === 'android' || platform === 'ios') {
    await nativeSignInWithGoogle()
  } else {
    await webSignInWithGoogle()
  }
}

export async function logout() {
  // TODO: Can we use Capacitor.isNativePlatform() here instead?
  if (Capacitor.getPlatform() !== 'web') {
    await SocialLogin.logout({ provider: 'google' }).catch((err) => console.warn(err))
  }
  await fbSignOut(getAuth())
}

//===============================================================
// INTERNALS
//===============================================================
async function ensureSocialLoginInit() {
  if (!isSocialLoginInitialized) {
    await SocialLogin.initialize({ google: { webClientId: WEB_CLIENT_ID } })
    isSocialLoginInitialized = true
  }
}

async function nativeSignInWithGoogle() {
  await ensureSocialLoginInit()

  const result = await SocialLogin.login({ provider: 'google' })

  // The native login gives us a special token
  const idToken = result?.result?.idToken || result?.authentication?.idToken
  if (!idToken) throw new Error('Native Google login failed.')

  // Use that token to sign into the Firebase SDK
  const cred = GoogleAuthProvider.credential(idToken)
  await signInWithCredential(getAuth(), cred)
}

async function webSignInWithGoogle() {
  try {
    return await signInWithPopup(getAuth(), new GoogleAuthProvider())
  } catch (error) {
    // If popups are blocked, redirect to a login page instead
    warn('Popup failed, fallback to using redirect.', error)
    await signInWithRedirect(getAuth(), new GoogleAuthProvider())
  }
}
