<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useBackendStore } from './services/backendStore';
import { onMounted, ref } from 'vue';
import SearchBox from './components/SearchBox.vue';
import { getAuth, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { useLogger } from './services/logger';
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useLocalStore } from "./services/localStore.js";

const router = useRouter()
const route = useRoute()
const backendStore = useBackendStore()
const localStore = useLocalStore()
const { log } = useLogger()

const timer = ref(null)

const copyLocalTasksToBackend = async () => {
  const numLocalTasks = await localStore.numTasks()
  console.log(`Found ${numLocalTasks} to copy to backend store`)

  if (numLocalTasks === 0) {
    return
  }

  if (backendStore.isLoaded && await backendStore.isReachable()) {
    while (true) {
      let localTask = null
      try {
        console.log(`Copying...`)
        localTask = await localStore.popTask()
        if (!localTask) {
          break
        }

        console.log("Copying local task to backend store:", localTask)
        const fields = { ...localTask, listId: backendStore.newItemsList.id }
        const newTask = await backendStore.addTask(fields)
        console.log("Created task in backend store:", newTask)
      } catch (e) {
        console.error("Error copying local task to backend store:", e)
        if (localTask != null) {
          console.log("Pushing local task back to local store:", localTask)
          await localStore.pushTask(localTask)
        }
        break
      }
    }
  } else {
    console.log("Backend store not loaded yet, so will not copy local tasks to backend store")
  }
}

onMounted(async () => {
  console.log("### App.onMounted() called")
  // TODO: Is this still required?
  if (Capacitor.isNativePlatform()) {
    log("Native platform, so will check if there has been a redirect to us after a successful auth")
    const result = await getRedirectResult(getAuth());
    log("Google redirect result is", result)
  }

  backendStore.init()

  timer.value = setInterval(copyLocalTasksToBackend, 10000)

  // Watch for user logout
  onAuthStateChanged(getAuth(), user => {
    log("onAuthStateChanged, user is ", user, "and route is", route.fullPath)
    if (!user) {
      if (!route.meta.allowUnauthorised) {
        log("User is logged out, and route requires auth, so routing to /auth/signin")
        router.push("/auth/signin")
      }
    }
  })


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