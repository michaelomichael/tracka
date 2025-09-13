<script setup>
import { useBackendStore } from "../services/backendStore";
import TaskList from "../components/TaskList.vue";
import { reactive, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import TaskEdit from "../components/TaskEdit.vue";

const backendStore = useBackendStore();

const router = useRouter()
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

    state.showEditor = route.name !== "home"
    console.log("Route name is", route.name, "and showEditor=", state.showEditor)


    if (route.params.taskId != null) {
        state.editingTaskId = route.params.taskId
    } else {
        state.editingTaskId = null
    }
    console.log("TaskListsVue.watchEffect: Setting state.editingTaskId to", state.editingTaskId)

    if (route.query.listId != null) {
        state.newTaskListId = route.query.listId
    } else {
        state.newTaskListId = null
    }
    console.log("TaskListsVue.watchEffect: Setting state.newTaskListid to", state.newTaskListId)
})

function handleModalClose(eventName, other) {
    console.log("Closed modal, eventName was", eventName, state.showEditor, other)
    router.push("/tasks")
}
</script>

<template>
    <div class="flex w-full h-full relative">
        <main class="flex-1 xoverflow-x-scroll p-0 bg-white ">
            <section v-if="state.isLoaded">
                <div class="flex ">
                    <TaskList v-for="list in backendStore.lists" :key="list.id" :listId="list.id" />
                </div>
            </section>
        </main>
        <!-- Docs at https://next--vue-modal-demo.netlify.app/ -->
        <Modal v-model="state.showEditor" :title="state.editingTaskId ? 'Edit Task' : 'Create Task'"
            @closing="handleModalClose()" @before-close="handleModalClose()" @closed="handleModalClose()"
            @update:modelValue="(x) => handleModalClose('update: modelValue', x)">
            <TaskEdit :taskId="state.editingTaskId" :listId="state.newTaskListId" />
        </Modal>
    </div>
</template>