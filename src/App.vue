<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useBackendStore } from './services/backendStore';
import { onMounted } from 'vue';
import SearchBox from './components/SearchBox.vue';
import { getAuth, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { useLogger } from './services/logger';
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const router = useRouter()
const route = useRoute()
const backendStore = useBackendStore()
const { log } = useLogger()

onMounted(async () => {
    if (Capacitor.isNativePlatform()) {
        log("Native platform, so will check if there has been a redirect to us after a successful auth")
        const result = await getRedirectResult(getAuth());
        log("Google redirect result is", result)
    }

    backendStore.init()

    // Watch for user logout
    onAuthStateChanged(getAuth(), user => {
        log("onAuthStateChanged", user)
        if (!user) {
            if (!route.meta.allowUnauthorised) {
                router.push("/auth/signin")
            }
        }
    })

    // TODO: Go back and figure out which of these should be kept
    document.addEventListener('androidIntent', (event) => {
        const path = event.targetWebViewPath
        log("### document received 'androidIntent' event with path", path, event)

        if (path != null) {
            router.push(path)
        }
    })

    CapacitorApp.addListener('appUrlOpen', (event) => {
        const url = event.url

        log('In CapacitorApp.addListener(), event is ', event)
        if (url.includes('/link/quickTask')) {
            log('Routing event')
            router.push('/quickTask')
        }
    })

    CapacitorApp.getLaunchUrl().then((result) => {
        log("In getLaunchUrl callback, result is", result)
        if (!result || !result.url) {
            return
        }

        const url = result.url;
        if (url.includes('/link/quickTask')) {
            log("Routing to /quickTask")
            router.push('/quickTask')
        }
    });
});

</script>

<template>
    <div>
        <header class="flex bg-gray-900 m-0 px-4 py-1 items-baseline sm:items-center justify-between">
            <nav class=" text-white text-sm flex gap-5 text-nowrap">
                <RouterLink to="/">
                    <i class="pi pi-home sm:!hidden text-lg mt-1"></i>
                    <span class="hidden sm:block">Home</span>
                </RouterLink>
                <RouterLink to="/settings">
                    <i class="pi pi-cog sm:!hidden text-lg mt-1"></i>
                    <span class="hidden sm:block">Settings</span>
                </RouterLink>
                <RouterLink to="/tasks/archive">
                    <i class="pi pi-box sm:!hidden text-lg mt-1"></i>
                    <span class="hidden sm:block">Archive</span>
                </RouterLink>
            </nav>
            <div class="flex gap-5">
                <RouterLink to="/auth/profile" class="text-white text-sm ">
                    <i class=" pi pi-user text-lg mt-1"></i>
                </RouterLink>
                <SearchBox />
            </div>
        </header>

        <main
            class="h-screen-minus-header max-h-screen-minus-header w-screen max-w-screen overflow-auto px-4 scroll-smooth snap-x snap-mandatory">
            <RouterView />
        </main>
    </div>
</template>