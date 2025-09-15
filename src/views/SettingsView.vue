<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../services/backendStore';
import ListsEditor from '../components/settings/ListsEditor.vue';

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

</script>

<template>
    <main class="m-4">
        <h1> Settings </h1>

        <ListsEditor />

    </main>
</template>