<script setup>
import { reactive } from 'vue';
import { Capacitor } from '@capacitor/core';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useLogger } from '../services/logger';

const { log, error } = useLogger()
const router = useRouter()
const auth = getAuth()
const toast = useToast()

const state = reactive({
    email: "",
    password: "",
})

async function signin() {
    log(`email is <${state.email}>`);
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

async function signInWithGoogle() {
    if (Capacitor.isNativePlatform()) {
        await signInWithGoogleRedirect()
    } else {
        await signInWithGooglePopup()
    }
    log("Finished signing in with Google")
}

async function signInWithGooglePopup() {
    log("Signing in with Google popup...")

    try {
        const result = await signInWithPopup(getAuth(), new GoogleAuthProvider())
        log("Got Google sign-in result", result)
        toast.success("Successfully logged in")
        router.push("/")
    } catch (e) {
        error("Failed to login with Google:", e)
        toast.error(`Login failed:\n\n${e.message}`)
    }
}

async function signInWithGoogleRedirect() {
    log("Signing in with Google redirect...")

    try {
        const result = await signInWithRedirect(getAuth(), new GoogleAuthProvider())
        log("Got Google sign-in result", result)
        toast.success("Successfully logged in")
        router.push("/")
    } catch (e) {
        error("Failed to login with Google:", e)
        toast.error(`Login failed:\n\n${e.message}`)
    }
}
</script>

<template>
    <h1>Sign In</h1>
    <form class="flex flex-col items-center gap-2" @submit.prevent="signin">
        <input type="text" class="border rounded w-80 p-2 mb-2" placeholder=" Email" v-model="state.email" />
        <input type="password" class="border rounded w-80 p-2 mb-2" placeholder="Password" v-model="state.password" />
        <div class="flex gap-4">
            <Button type="submit">Submit</Button>
            <Button @click="signInWithGoogle">Sign In With Google</Button>
        </div>
        <div>
            Don't have an account? <RouterLink class="text-link" to="/auth/signup">Sign-up here.</RouterLink>
        </div>
    </form>
</template>