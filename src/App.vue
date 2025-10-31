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
                <RouterLink to="/tasks/new">
                    <i class="pi pi-plus-circle sm:!hidden text-lg mt-1"></i>
                    <span class="hidden sm:block">New Task</span>
                </RouterLink>
            </nav>
            <SearchBox />
        </header>

        <main
            class="h-screen-minus-header max-h-screen-minus-header w-screen max-w-screen overflow-auto xscroll-smooth xsnap-x xsnap-mandatory">
            <RouterView />
        </main>
    </div>
</template>