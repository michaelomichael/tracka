<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useBackendStore } from './services/backendStore';
import { onMounted } from 'vue';
import SearchBox from './components/SearchBox.vue';

const backendStore = useBackendStore()

onMounted(() => {
    backendStore.init()
})

</script>

<template>
    <header class="flex bg-gray-900 m-0 px-4 py-1 items-baseline justify-between w-full">
        <nav class=" text-white text-sm flex gap-5">
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/tasks/new">New Task</RouterLink>
        </nav>
        <SearchBox />
    </header>

    <RouterView />
</template>