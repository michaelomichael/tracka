<script setup>
import { useBackendStore } from "../services/backendStore";
import TaskList from "../components/TaskList.vue";
import { reactive, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import TaskEdit from "../components/TaskEdit.vue";
import { useLogger } from "../services/logger";

const { log } = useLogger()
const backendStore = useBackendStore()

const router = useRouter()
const route = useRoute()

const state = reactive({
    editingTaskId: null,
    newTaskListId: null,
    showEditor: false,
    isLoaded: false,
    isInitialScrollingDone: false,
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.isLoaded = true
    }
    if (state.isLoaded && !state.isInitialScrollingDone) {
        setTimeout(() => {
            // TODO - remember the previously centred list?
            const visibleList = backendStore.lists.find(list => list.name.toUpperCase() === "TODAY")
            log("Will try to centre list", visibleList)
            if (visibleList != null) {
                const elem = document.querySelector(`section.tracka-list[data-list-id='${visibleList.id}']`)
                if (elem) {
                    log("Got list elem", elem)
                    elem.scrollIntoView({
                        behavior: "instant",
                        block: "nearest",
                        inline: "center",
                    })
                } else {
                    log("Didn't find list elem with ID", visibleList.id)
                }
            }
        }, 100)
        state.isInitialScrollingDone = true
    }

    state.showEditor = route.name !== "home"
    log("watchEffect: Route name is", route.name, "and showEditor=", state.showEditor)

    if (route.params.taskId != null) {
        state.editingTaskId = route.params.taskId
    } else {
        state.editingTaskId = null
    }
    log("watchEffect: Setting state.editingTaskId to", state.editingTaskId)

    if (route.query.listId != null) {
        state.newTaskListId = route.query.listId
    } else {
        state.newTaskListId = null
    }
    log("watchEffect: Setting state.newTaskListid to", state.newTaskListId)
})

function handleModalClose(eventName, other) {
    router.push("/tasks")
}
</script>

<template>
    <section class="flex w-screen">
        <TaskList v-if="state.isLoaded" v-for="list in backendStore.lists" :key="list.id" :listId="list.id" />
        <!-- Docs at https://next--vue-modal-demo.netlify.app/ -->
        <Modal v-model="state.showEditor" :title="state.editingTaskId ? 'Edit Task' : 'Create Task'"
            @closing="handleModalClose()" @before-close="handleModalClose()" @closed="handleModalClose()"
            @update:modelValue="(x) => handleModalClose('update: modelValue', x)"
            modalClass="dark:!bg-gray-900 dark:!border-gray-500 border-2" bgClass="!bg-black opacity-80">
            <TaskEdit :taskId="state.editingTaskId" :listId="state.newTaskListId" />
        </Modal>
    </section>
</template>