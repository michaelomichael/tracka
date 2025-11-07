<script setup>
import { useBackendStore } from '../services/backendStore';
import { reactive, watchEffect } from 'vue';
import ProgressBar from './widgets/ProgressBar.vue';
import { stringToHslColour } from '../services/utils';

const backendStore = useBackendStore();

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
    progress: -1,
})

watchEffect(async () => {
    if (backendStore.isLoaded) {
        state.task = backendStore.getTask(props.taskId);
        state.parentTask = backendStore.getParentTaskForTask(state.task)
        state.childTasks = backendStore.getChildTasksForTask(state.task)

        state.progress =
            state.childTasks.filter(childTask => childTask.isDone).length /
            state.childTasks.length

        state.isLoaded = true
    }
})
</script>

<template>
    <RouterLink v-if="state.isLoaded" :to="`/tasks/${taskId}/edit`"
        class="block bg-task-card hover:bg-gray-200 rounded-md my-4 border-color-task-box border-2 p-4"
        :data-task-id="taskId">
        <p v-if="state.parentTask !== null" class="text-2xs mb-2">
            <RouterLink :to="`/tasks/${state.parentTask.id}/edit`"
                class="rounded-sm bg-emerald-500 hover:bg-emerald-900 text-amber-50 py-1 px-2"
                :style="`background-color: ${stringToHslColour(state.parentTask.id)}`" title="Parent">
                {{ state.parentTask.title }}
            </RouterLink>
        </p>
        <h3 class="text-sm font-semibold  font-task-card-title">
            <i v-if="state.task.isDone" class="pi pi-check-circle mr-1 bg-green-500 rounded-4xl" />
            {{ state.task.title }}
        </h3>

        <p class="text-xs"> {{ state.task.description }} </p>

        <div v-if="state.childTasks.length > 0" class="text-xs">
            <ProgressBar class="mt-2" :progress="state.progress" />
            <ul class="m-2 px-2">
                <li v-for="childTask in state.childTasks" :key="childTask.id" class="list-disc">
                    <!-- TODO: Add an icon beside each one if it's done -->
                    <RouterLink :to="`/tasks/${childTask.id}/edit`">
                        ({{ backendStore.getListForTask(childTask)?.name }}) {{ childTask.title }}
                    </RouterLink>
                </li>
            </ul>
        </div>
    </RouterLink>
</template>