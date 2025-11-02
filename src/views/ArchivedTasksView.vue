<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../services/backendStore';
import Loading from '../components/widgets/Loading.vue';
import { useLogger } from '../services/logger';

const { log } = useLogger()
const backendStore = useBackendStore()

const state = reactive({
    isLoaded: false,
    archivedTasks: [],
})

watchEffect(async () => {
    log("Backend store has loaded, so will grab archived tasks now")
    if (backendStore.isLoaded) {
        log("Backend store has loaded, so will grab archived tasks now")
        state.archivedTasks = await backendStore.getArchivedTasks()
        log(`Got ${state.archivedTasks.length} archived tasks`)
        state.isLoaded = true
    }
})
</script>

<template>
    <main>
        <h1>Archived Tasks</h1>
        <section v-if="state.isLoaded">
            <table class="border-collapse border-amber-700">
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Date archived</th>
                </tr>
                <tr v-for="task in state.archivedTasks">
                    <td>{{ task.id }}</td>
                    <td>{{ task.title }}</td>
                    <td class="font-mono">{{ task.archivedTimestamp }}</td>
                </tr>
            </table>
        </section>

        <Loading v-else />
    </main>
</template>

<style scoped>
th,
td {
    padding: 0.4rem;
    border: 1px solid gray;
    text-align: left;
}
</style>