<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../../services/backendStore';
import Loading from '../widgets/Loading.vue';

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
    await backendStore.archiveDoneTasks()
}
</script>

<template>
    <div>
        <div v-if="state.isLoaded">
            <Button @click.prevent="archiveOldTasks"> Archive Old Tasks </Button>
        </div>
        <Loading v-else />
    </div>
</template>