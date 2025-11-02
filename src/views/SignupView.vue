<script setup>
import { reactive } from 'vue';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useLogger } from '../services/logger';

const router = useRouter()
const toast = useToast()
const { log, error } = useLogger()

const state = reactive({
    email: "",
    password: "",
})

async function register() {
    log(`Email is <${state.email}>`);
    try {
        await createUserWithEmailAndPassword(getAuth(), `${state.email}`, `${state.password}`)
        log("Signed up with email")
        toast.success("Successfully signed up!")
        router.push("/")
    } catch (e) {
        error(e)
        toast.error(`Login failed:\n\n${e.message}`)
    }
}

</script>

<template>
    <h1>Create an Account</h1>
    <section class="flex flex-col items-center gap-2">
        <input type="text" class="border rounded w-80 p-2 mb-2" placeholder=" Email" v-model="state.email" />
        <input type="password" class="border rounded w-80 p-2 mb-2" placeholder="Password" v-model="state.password" />
        <div class="flex gap-4">
            <button class="standard-button" @click="register">Submit</button>
        </div>
    </section>
</template>