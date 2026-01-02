<script setup>
import { reactive, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useBackendStore } from "../services/backendStore";
import { useLogger } from "../services/logger";
import Loading from "./widgets/Loading.vue";
import { Fieldset } from "primevue";

const { log } = useLogger()
const backendStore = useBackendStore()
const toast = useToast();
const router = useRouter()

const props = defineProps({
  listId: {
    type: String,
    required: true,
  },
})

const state = reactive({
  list: null,
  successorList: null,
  isLoaded: false,
})

const form = reactive({
  moveTasksToSuccessor: true,
  tasksDestinationListId: null,
})

watchEffect(() => {
  if (backendStore.isLoaded) {
    if (state.list?.id !== props.listId) {
      state.list = backendStore.getList(props.listId)

      const thisListIndex = backendStore.board.listIds.findIndex(id => id === state.list.id)
      const successorListIndex = thisListIndex > 0 ? thisListIndex - 1 : thisListIndex + 1

      state.successorList = backendStore.getList(backendStore.board.listIds[successorListIndex]) ?? null
      state.isLoaded = true

      form.tasksDestinationListId = state.successorList?.id ?? null
    }
  }
})

async function handleMoveToFarLeft() {
  try {
    const targetIndex = backendStore.lists.findIndex(list => list.specialCategory == null)
    log("Target index is ", targetIndex)

    if (backendStore.board.listIds[targetIndex] === state.list.id) {
      log(`List '${state.list.name}' is already at the target index ${targetIndex}, so won't do anything`)
      return
    }

    if (form.moveTasksToSuccessor && state.successorList != null && state.list.taskIds.length > 0) {
      log(`Moving tasks to successor list first'${state.successorList.name}'`)

      await backendStore.moveTasks(state.list, state.successorList)
      state.list = backendStore.getList(state.list.id, true)
    }

    await backendStore.patchBoard({
      listIds: backendStore.board.listIds
        .filter(id => id !== state.list.id).toSpliced(targetIndex, 0, state.list.id)
    })

    toast.success(`Moved list "${state.list.name}".`)
    router.push("/")
  } catch (e) {
    log("Error moving list to far left:", e)
    toast.error(`Error moving list: ${e.message}`)
  }
}

async function handleMoveTasks() {
  try {
    const targetList = backendStore.getList(form.tasksDestinationListId, true)

    await backendStore.moveTasks(state.list, targetList)
    state.list = backendStore.getList(state.list.id, true)

    toast.success(`Moved tasks to "${targetList.name}".`)
  } catch (e) {
    log("Error moving tasks:", e)
    toast.error(`Error moving tasks: ${e.message}`)
  }
}
</script>

<template>
  <section class="max-w-full m-auto">
    <div v-if="state.isLoaded" class="flex flex-col gap-4">

      <Fieldset legend="Move List">
        <form class="flex flex-col gap-4 items-baseline" @submit.prevent="handleMoveToFarLeft">
          <div v-if="state.successorList != null && state.list.taskIds.length > 0">
            <label class=" mr-2" for="moveTasksToSuccessor">
              <input type="checkbox" id="moveTasksToSuccessor" v-model="form.moveTasksToSuccessor" />
              Move tasks to successor list ("{{ state.successorList.name }}")
            </label>
          </div>

          <Button
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline"
            type="submit">
            Move to after Backlog
          </Button>

        </form>
      </Fieldset>


      <Fieldset legend="Move Tasks" v-if="state.list.taskIds.length > 0">
        <form class="flex flex-col gap-4 items-baseline" @submit.prevent="handleMoveTasks">
          <div class="flex items-baseline gap-4">
            <div>
              <label for="tasksDestinationListId">
                Destination list:
              </label>
            </div>
            <select v-model="form.tasksDestinationListId" id="tasksDestinationListId" name="tasksDestinationListId"
              class="border rounded p-2" required>
              <option v-for="list in backendStore.lists.filter(list => list.id !== state.list.id)" :key="list.id"
                :value="list.id">
                {{ list.name }}
              </option>
            </select>
          </div>

          <Button
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline"
            type="submit">
            Move Tasks
          </Button>

        </form>
      </Fieldset>
      <!--
        <div class="flex gap-2 mb-4 items-stretch">
            <form @submit.prevent="handleSubmit">
                <div :class="`rounded-md border-1 p-2 border-gray-800 flex gap-1 ${form.isDone ? 'bg-green-500' : ''}`">
                    <input type="checkbox" id="done" v-model="form.isDone" @change="handleChange"
                        v-bind:autofocus="!state.isNew" />
                    <label for="done">Done?</label>
                </div>

                <select v-if="!form.isDone" v-model="form.listId" id="listId" name="listId" @change="handleChange"
                    class="border rounded w-full p-2" required>
                    <option v-for="list in backendStore.lists.filter(list => list.id !== backendStore.doneList.id)"
                        :key="list.id" :value="list.id">{{
                            list.name }}
                    </option>
                </select>
            </form>
        </div>
        -->
    </div>
    <Loading v-else />
  </section>
</template>