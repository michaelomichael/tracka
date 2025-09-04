<script setup>
import { onMounted, reactive } from 'vue';
import backend from '../services/backend';


const props = defineProps({
    id: String,
});

const state = reactive({
    task: {},
    parentTask: null,
    childTasks: [],
    isLoading: true,
});

onMounted(() => {
    console.log("Loading task with id", props.id);
    state.task = backend.getTask(props.id);

    state.parentTask = state.task.parentTaskId ? backend.getTask(state.task.parentTaskId) : null;
    state.childTasks = state.task.childTaskIds.map(childTaskId => backend.getTask(childTaskId));

    state.isLoading = false;
});
</script>

<template>
    <section class="bg-gray-100 hover:bg-gray-200 rounded-md w-60 my-4 border-2 p-4">
        <RouterLink v-if="!state.isLoading" :to="`/tasks/${id}/edit`">
            <p v-if="state.parentTask !== null" class="text-xs mb-2">
                <RouterLink :to="`/tasks/${state.parentTask.id}/edit`"
                    class="rounded-sm bg-emerald-500 hover:bg-emerald-900 text-amber-50 py-1 px-2">
                    Parent: {{ state.parentTask.title }}
                </RouterLink>
            </p>
            <h3 class="text-lg font-semibold">{{ state.task.title }}</h3>
            <p v-if="state.childTasks.length > 0" class="text-xs">
                Progress:
                {{state.childTasks.filter(childTask => childTask.listId === '1').length}}
                /
                {{ state.childTasks.length }}
            </p>

            <p class="text-sm"> {{ state.task.description }} </p>
        </RouterLink>
        <p v-else>Loading...</p>
    </section>
</template>