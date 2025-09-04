<script setup>
import backend from "@/services/backend"
import { onMounted, reactive } from "vue";
import TaskList from "../components/TaskList.vue";

const state = reactive({
    lists: [],
    isLoading: true,
});
onMounted(() => {
    console.log("Backend is ", backend);
    state.lists = backend.getLists();
    console.log("Loaded lists", state.lists);
    state.isLoading = false;
});
</script>

<template>
    <div class="flex w-full h-full">
        <main class="flex-1 overflow-x-auto p-6 bg-white">
            <h2>Lists galore!</h2>

            <section v-if="!state.isLoading">
                <div class="flex ">
                    <TaskList v-for="list in state.lists" :key="list.id" :list="list" />
                </div>

            </section>
            <p v-else>Loading...</p>
        </main>
        <section id="sidePanel" class="min-h-screen w-64 bg-gray-100 border-r border-gray-300 border-l-1 p-6">
            Side panel
        </section>
    </div>
</template>