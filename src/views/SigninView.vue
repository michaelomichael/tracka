<script setup>
import { reactive } from 'vue';
import { Capacitor } from '@capacitor/core';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useLogger } from '../services/logger';
import { signInWithGoogle } from "../services/auth";

const { log, error } = useLogger()
const router = useRouter()
const auth = getAuth()
const toast = useToast()

const state = reactive({
  email: "",
  password: "",
})

async function handleSignInWithEmailAndPassword() {
  log(`Email is <${state.email}>`);
  try {
    await signInWithEmailAndPassword(auth, `${state.email}`, `${state.password}`)
    log("Signed in!", auth.currentUser)
    toast.success("Successfully logged in")
    router.push("/")
  } catch (e) {
    error(`Failed to login with ${state.email}:`, e)
    toast.error(`Login failed:\n\n${e.message}`)
  }
}

async function handleSignInWithGoogle() {
  log(`About to sign in with Google`)
  try {
    await signInWithGoogle()
    log("Signed in!", auth.currentUser)
    toast.success("Successfully logged in")
    router.push("/")
  } catch (e) {
    error(`Failed to login with Google:`, e)
    toast.error(`Login failed:\n\n${e.message}`)
  }
}
</script>

<template>
  <h1>Sign In</h1>
  <form class="flex flex-col items-center gap-2" @submit.prevent="handleSignInWithEmailAndPassword">
    <input type="text" class="border rounded w-80 p-2 mb-2" placeholder=" Email" v-model="state.email" />
    <input type="password" class="border rounded w-80 p-2 mb-2" placeholder="Password" v-model="state.password" />
    <div class="flex gap-4">
      <Button type="submit">Submit</Button>
      <Button @click="handleSignInWithGoogle">Sign In With Google</Button>
    </div>
    <div>
      Don't have an account? <RouterLink class="text-link" to="/auth/signup">Sign-up here.</RouterLink>
    </div>
  </form>
</template>