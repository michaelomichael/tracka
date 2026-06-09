<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../../services/backendStore';
import Loading from '../widgets/Loading.vue';
import { useLogger } from "../../services/logger";
import SmartForm from "../widgets/SmartForm.vue";
import { useToast } from "vue-toastification";

const { log } = useLogger()
const toast = useToast();

const backendStore = useBackendStore()

const state = reactive({
  isLoaded: false,
})

watchEffect(() => {
  if (backendStore.isLoaded) {
    state.isLoaded = true
  }
})

async function archiveOldTasks() {
  log("About to archive old tasks...")
  const numTasksArchived = await backendStore.archiveDoneTasks()
  toast.success(`Archived ${numTasksArchived} task${numTasksArchived === 1 ? "" : "s"}`);
}
</script>

<template>
  <div>
    <SmartForm v-if="state.isLoaded" @submit="archiveOldTasks">
      <Button type="submit"> Archive Old Tasks </Button>
    </SmartForm>
    <Loading v-else />
  </div>
</template>