<script setup>
import { useBackendStore } from "../services/backendStore";
import TaskList from "../components/TaskList.vue";
import { reactive, watchEffect } from "vue";
import { useRoute } from "vue-router";
import TaskEdit from "../components/TaskEdit.vue";

const backendStore = useBackendStore();

const route = useRoute()

const state = reactive({
    editingTaskId: null,
    newTaskListId: null,
    showEditor: false,
    isLoaded: false,
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.isLoaded = true
    }

    state.showEditor = route.name !== "task-lists"
    console.log("Route name is", route.name, "and showEditor=", state.showEditor)


    if (route.params.id != null) {
        state.editingTaskId = route.params.id
    } else {
        state.editingTaskId = null
    }

    if (route.query.listId != null) {
        state.newTaskListId = route.query.listId
    } else {
        state.newTaskListId = null
    }
})
</script>

<template>
    <div class="flex w-full h-full">
        <main class="flex-1 overflow-x-auto p-6 bg-white">
            <h2>Lists galore!</h2>

            <section v-if="state.isLoaded">
                <div class="flex ">
                    <TaskList v-for="list in backendStore.lists" :key="list.id" :listId="list.id" />
                </div>
            </section>
        </main>
        <section v-if="state.showEditor" id="sidePanel"
            class="min-h-screen w-64 bg-gray-100 border-r border-gray-300 border-l-1 p-6">
            Side panel
            <TaskEdit :taskId="state.editingTaskId" :listId="state.newTaskListId" />
        </section>
    </div>
</template>