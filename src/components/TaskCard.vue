<script setup>
import { useBackendStore } from '../services/backendStore';
import { reactive, watchEffect } from 'vue';
import ProgressBar from './ProgressBar.vue';

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
    progressPercentage: -1,
})

watchEffect(async () => {
    console.log("TaskCard.updateState: backendStore.isLoaded = ", JSON.stringify(backendStore.isLoaded))
    if (backendStore.isLoaded) {
        state.task = backendStore.getTask(props.taskId);
        state.parentTask = backendStore.getParentTaskForTask(state.task)
        state.childTasks = backendStore.getChildTasksForTask(state.task)

        state.progress =
            state.childTasks.filter(childTask => childTask.listId === '1').length /
            state.childTasks.length

        state.isLoaded = true
    }
})
</script>

<template>
    <section v-if="state.isLoaded" class="bg-gray-100 hover:bg-gray-200 rounded-md w-60 my-4 border-2 p-4">
        <RouterLink :to="`/tasks/${taskId}/edit`">
            <p v-if="state.parentTask !== null" class="text-xs mb-2">
                <RouterLink :to="`/tasks/${state.parentTask.id}/edit`"
                    class="rounded-sm bg-emerald-500 hover:bg-emerald-900 text-amber-50 py-1 px-2">
                    Parent: {{ state.parentTask.title }}
                </RouterLink>
            </p>
            <h3 class="text-lg font-semibold">{{ state.task.title }}</h3>

            <p class="text-sm"> {{ state.task.description }} </p>

            <div v-if="state.childTasks.length > 0" class="text-xs">
                <ProgressBar class="mt-2" :progress="state.progress" />
                <ul class="m-2 px-2">
                    <li v-for="childTask in state.childTasks" :key="childTask.id" class="list-disc">
                        <RouterLink :to="`/tasks/${childTask.id}/edit`">
                            {{ backendStore.getListForTask(childTask)?.name }} - {{ childTask.title }}
                        </RouterLink>
                    </li>
                </ul>
            </div>
        </RouterLink>
    </section>
</template>