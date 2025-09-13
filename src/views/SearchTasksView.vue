<script setup>
import { reactive, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import TaskCard from '../components/TaskCard.vue';
import { useBackendStore } from '../services/backendStore';

const backendStore = useBackendStore()
const route = useRoute()

const state = reactive({
    isLoaded: false,
    searchString: "",
    results: [],
})

watchEffect(() => {
    state.isLoaded = false
    state.searchString = route.query.search
    if (backendStore.isLoaded && state.searchString != null && state.searchString !== "") {
        state.results = backendStore.findTasks(state.searchString)
        state.isLoaded = true
    }
})
</script>

<template>
    <main class="p-4">
        <div v-if="state.isLoaded">
            <h2 class="font-semibold text-xl">Search Results</h2>
            <div v-if="state.results.length > 0">
                <p>Found {{ state.results.length }} matching {{ state.results.length === 1 ? "task" : "tasks" }}</p>
                <div class="flex gap-4">
                    <TaskCard v-for="task of state.results" :taskId="task.id" />
                </div>
            </div>
            <div v-else>
                No matches for '{{ state.searchString }}'
            </div>
        </div>

        <div v-else>
            Loading...
        </div>
    </main>
</template>