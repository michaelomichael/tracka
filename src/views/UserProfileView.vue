<script setup>
import { reactive, watchEffect } from 'vue';
import { getAuth, signOut } from 'firebase/auth';
import { RouterLink } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useLogger } from '../services/logger';

const { log } = useLogger()
const toast = useToast()
const auth = getAuth()

const state = reactive({
    currentUser: null,

})

watchEffect(() => {
    state.currentUser = auth.currentUser
    log(`Current user is`, state.currentUser)
})

function logout() {
    signOut(auth)
    toast.success(`Signed out`)
}

</script>

<template>
    <div>
        <h1>User Profile</h1>

        <section v-if="state.currentUser">
            <div class="grid grid-cols-[auto_auto] w-fit">
                <label>Display name</label>
                <div> {{ state.currentUser.displayName }} </div>
                <label>Email</label>
                <div> {{ state.currentUser.email }}</div>
                <label>UID </label>
                <div>{{ state.currentUser.uid }}</div>
                <label>Email verified</label>
                <div> {{ state.currentUser.emailVerified }} </div>
                <label>Auth provider</label>
                <div> {{ state.currentUser.providerData[0]?.providerId }} </div>
            </div>

            <div class="mt-4">
                <Button @click="logout">Logout</Button>
            </div>
        </section>
        <section v-else>
            Not logged in.
            <p />
            <RouterLink class="text-link" to="/auth/signin">
                Sign In
            </RouterLink>
        </section>
    </div>
</template>

<style scoped>
.grid {
    border: 1px solid gray;
    border-bottom: none;
}

.grid * {
    border-bottom: 1px solid gray;
    padding: 0.5rem 1rem;
}

.grid label {
    font-weight: 600;
}
</style>