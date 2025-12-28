<script setup>
import { useBackendStore } from "../services/backendStore";
import TaskList from "../components/TaskList.vue";
import { reactive, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import TaskEdit from "../components/TaskEdit.vue";
import { useLogger } from "../services/logger";
import ListEdit from "../components/ListEdit.vue";

const { log } = useLogger()
const backendStore = useBackendStore()

const router = useRouter()
const route = useRoute()

const state = reactive({
  editingTaskId: null,
  newTaskListId: null,
  editingListId: null,
  editingList: null,
  showTaskEditor: false,
  showListEditor: false,
  isLoaded: false,
  isInitialScrollingDone: false,
})

watchEffect(() => {
  if (backendStore.isLoaded) {
    state.showListEditor = false
    state.editingListId = null
    state.editingList = null

    state.showTaskEditor = false
    state.editingTaskId = null
    state.newTaskListId = null

    if (route.name === "edit-list") {
      state.showListEditor = true
      state.editingListId = route.params.listId
      state.editingList = backendStore.getList(state.editingListId)
    } else if (route.name !== "home") {
      state.showTaskEditor = true
      state.editingTaskId = route.params.taskId ?? null
      state.newTaskListId = route.query.listId ?? null
    }

    state.isLoaded = true

    if (!state.isInitialScrollingDone) {
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
  }
})

function handleModalClose(eventName, other) {
  router.push("/tasks")
}
</script>

<template>
  <section class="flex w-screen">
    <TaskList v-if="state.isLoaded" v-for="list in backendStore.lists" :key="list.id" :listId="list.id" />

    <!-- Docs at https://next--vue-modal-demo.netlify.app/ -->
    <Modal v-model="state.showTaskEditor" :title="state.editingTaskId ? 'Edit Task' : 'Create Task'"
      @closing="handleModalClose()" @before-close="handleModalClose()" @closed="handleModalClose()"
      @update:modelValue="(x) => handleModalClose('update: modelValue', x)"
      modalClass="dark:!bg-gray-900 dark:!border-gray-500 border-2" bgClass="!bg-black opacity-80">
      <TaskEdit v-if="state.editingTaskId != null" :taskId="state.editingTaskId" :listId="state.newTaskListId" />
    </Modal>

    <Modal v-model="state.showListEditor" :title="`List: ${state.editingList?.name ?? ''}`"
      @closing="handleModalClose()" @before-close="handleModalClose()" @closed="handleModalClose()"
      @update:modelValue="(x) => handleModalClose('update: modelValue', x)"
      modalClass="dark:!bg-gray-900 dark:!border-gray-500 border-2" bgClass="!bg-black opacity-80">
      <ListEdit v-if="state.editingListId != null" :listId="state.editingListId" />
    </Modal>

  </section>
</template>