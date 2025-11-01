<script setup>
import { getCurrentInstance, reactive } from 'vue';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useLogger } from '../services/useLogger';

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
    log("Signing in with Google...")
    try {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(getAuth(), provider)
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
    <section class="flex flex-col items-center gap-2">
        <input type="text" class="border rounded w-80 p-2 mb-2" placeholder=" Email" v-model="state.email" />
        <input type="password" class="border rounded w-80 p-2 mb-2" placeholder="Password" v-model="state.password" />
        <div class="flex gap-4">
            <button class="standard-button" @click="signin">Submit</button>
            <button class="standard-button" @click="signInWithGoogle">Sign In With Google</button>
        </div>
        <div>
            Don't have an account? <RouterLink class="text-link" to="/auth/signup">Sign-up here.</RouterLink>
        </div>
    </section>
</template>