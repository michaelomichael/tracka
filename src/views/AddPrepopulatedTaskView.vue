<script setup>
import { watchEffect } from 'vue';
import { useToast } from "vue-toastification";
import { useLogger } from "../services/logger.js";
import { useLocalStore } from "../services/localStore.js";
import { useRoute, useRouter } from "vue-router";

const { log, warn } = useLogger()
const localStore = useLocalStore()
const toast = useToast()
const TOAST_TIMEOUT_MS = 4000
const route = useRoute()
const router = useRouter()

watchEffect(() => {
  log("watchEffect: route.query is", JSON.stringify(route.query))
  const title = route.query.title
  const description = route.query.description
  setTimeout(async () => await saveTaskAndReroute(title, description), 10)
})

const saveTaskAndReroute = async (title, description) => {
  if (title == null || title.trim() == "") {
    warn("No title provided, so not saving task")
    toast.warning("No title provided, so not saving task", { timeout: TOAST_TIMEOUT_MS })
  } else {
    log("Saving new pre-populated task")
    localStore.pushTask({
      title: title,
      description: description,
    })
    toast.success(`Task '${title}' will be added when network is available`, { timeout: TOAST_TIMEOUT_MS })
  }

  log("Onward routing to /quickTask...")
  await router.replace({ path: '/quickTask', query: {} })
}

</script>

<template>
  <main class="m-4">
    <section class="w-60 m-auto">
      <h2 class="m-3 text-center">
        Adding Pre-populated Task...
      </h2>
    </section>
  </main>
</template>