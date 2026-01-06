<script setup>
import { useBackendStore } from '../services/backendStore';
import { reactive, watchEffect } from 'vue';
import ProgressBar from './widgets/ProgressBar.vue';
import { stringToHslColour, taskDueByPanicIndex, taskDueByDescription } from '../services/utils';
import { useLogger } from "../services/logger";

const backendStore = useBackendStore();
const { log, warn } = useLogger();

const props = defineProps({
  taskId: {
    type: String,
    required: true,
  }
});

const state = reactive({
  isLoaded: false,
  task: {},
  parentTask: {},
  childTasks: [],
  numCompletedChildTasks: 0,
  incompleteChildTasks: [],
  progress: -1,
  progress2: -1,
  taskPanicIndex: 0,
  isOverdue: false,
  dueDateDescription: null,
})

watchEffect(async () => {
  if (backendStore.isLoaded) {
    state.task = backendStore.getTask(props.taskId);

    if (state.task == null) {
      warn(`In watchEffect(), task for id '${props.taskId}' is null`);
      return;
    }
    state.parentTask = backendStore.getParentTaskForTask(state.task)
    state.childTasks = backendStore.getChildTasksForTask(state.task).toSorted((a, b) => a.isDone && !b.isDone ? -1 : (b.isDone && !a.isDone ? 1 : 0))
    state.numCompletedChildTasks = state.childTasks.filter(childTask => childTask.isDone).length
    state.incompleteChildTasks = state.childTasks.filter(childTask => !childTask.isDone)

    state.progress =
      state.numCompletedChildTasks /
      state.childTasks.length

    state.progress2 = state.progress +
      (state.childTasks.filter(childTask => backendStore.getListForTask(childTask)?.name?.toLowerCase() === "waiting").length /
        state.childTasks.length)

    state.taskPanicIndex = taskDueByPanicIndex(state.task)

    state.isOverdue = state.taskPanicIndex === 4
    state.dueDateDescription = taskDueByDescription(state.task.dueByTimestamp)

    state.isLoaded = true
  }
})

function getListDescriptionForChildTask(childTask) {
  const list = backendStore.getListForTask(childTask)

  if (list?.specialCategory === "DONE") {
    return "✅"
  }

  return `⟪${list.name ?? "???"}⟫`
}
</script>

<template>
  <RouterLink v-if="state.isLoaded" :to="`/tasks/${taskId}/edit`"
    :class="`block bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-600 dark:border-gray-500 rounded-md my-4 border-2 p-4 task-due-by-${state.taskPanicIndex}`"
    :data-task-id="taskId">
    <p v-if="state.parentTask !== null" class="text-2xs mb-2">
      <RouterLink :to="`/tasks/${state.parentTask.id}/edit`"
        class="rounded-sm bg-emerald-500 hover:bg-emerald-900 text-amber-50 py-1 px-2"
        :style="`background-color: ${stringToHslColour(state.parentTask.id)}`" title="Parent">
        {{ state.parentTask.title }}
      </RouterLink>
    </p>
    <h3 class="!text-sm font-semibold  font-task-card-title">
      <i v-if="state.task.isDone" class="pi pi-check-circle mr-1 bg-green-500 rounded-4xl" />
      {{ state.task.title }}
    </h3>

    <p v-if="state.dueDateDescription !== null"
      :class="`text-xs font-medium mt-1 ${state.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`"
      :title="state.task.dueByTimestamp">
      {{ state.dueDateDescription }}
    </p>

    <p class="text-xs overflow-x-clip"> {{ state.task.description }} </p>

    <div v-if="state.childTasks.length > 0" class="text-xs">
      <ProgressBar class="mt-2" :progress="state.progress" :progress2="state.progress2" />

      <p v-if="state.numCompletedChildTasks > 0 && state.incompleteChildTasks.length > 0" class="mt-2">
        {{ state.numCompletedChildTasks }} completed, plus:
      </p>

      <ul v-if="state.incompleteChildTasks.length > 0" class="m-2 px-2">
        <li v-for="childTask in state.incompleteChildTasks" :key="childTask.id" class="list-disc">
          <span>
            <!-- <RouterLink :to="`/tasks/${childTask.id}/edit`"> -->
            {{ getListDescriptionForChildTask(childTask) }} {{ childTask.title }}
            <!-- </RouterLink> -->
          </span>
        </li>
      </ul>
    </div>
  </RouterLink>
</template>