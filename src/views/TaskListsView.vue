<script setup>
import { useBackendStore } from "../services/backendStore";
import TaskList from "../components/TaskList.vue";

const backendStore = useBackendStore();
</script>

<template>
    <div class="flex w-full h-full">
        <main class="flex-1 overflow-x-auto p-6 bg-white">
            <h2>Lists galore!</h2>

            <section>
                <div class="flex ">
                    <TaskList v-for="list in Object.values(backendStore.listsById)" :key="list.id" :listId="list.id" />
                </div>
            </section>
        </main>
        <section id="sidePanel" class="min-h-screen w-64 bg-gray-100 border-r border-gray-300 border-l-1 p-6">
            Side panel
        </section>
    </div>
</template>