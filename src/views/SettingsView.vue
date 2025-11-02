<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../services/backendStore';
import ListsEditor from '../components/settings/ListsEditor.vue';
import Loading from '../components/widgets/Loading.vue';

const backendStore = useBackendStore()

const state = reactive({
    isLoaded: false,
    lists: null,
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.lists = backendStore.lists
        state.isLoaded = true
    }
})

async function archiveOldTasks() {
    await backendStore.archiveDoneTasks()
}

</script>

<template>
    <main class="m-4">
        <h1> Settings </h1>

        <div v-if="state.isLoaded">
            <section>
                <h2> Lists</h2>
                <ListsEditor />
            </section>
            <section>
                <h2>Housekeeping</h2>
                <button class="standard-button" @click.prevent="archiveOldTasks"> Archive Old Tasks </button>
            </section>
        </div>

        <Loading v-else />
    </main>
</template>