<script setup>
import { useBackendStore } from '../services/backendStore';

const backendStore = useBackendStore();

const props = defineProps({
    id: String,
});

const task = backendStore.tasksById[props.id]
const parentTask = task.parentTaskId === null ? null : backendStore.tasksById[task.parentTaskId]
const childTasks = task.childTaskIds
    .map((childTaskId) => backendStore.tasksById[childTaskId])
    .filter((childTask) => childTask !== null)

const progressPercentage = Math.floor(
    100 *
    childTasks.filter(childTask => childTask.listId === '1').length /
    childTasks.length
)
</script>

<template>
    <section class="bg-gray-100 hover:bg-gray-200 rounded-md w-60 my-4 border-2 p-4">
        <RouterLink :to="`/tasks/${id}/edit`">
            <p v-if="parentTask !== null" class="text-xs mb-2">
                <RouterLink :to="`/tasks/${parentTask.id}/edit`"
                    class="rounded-sm bg-emerald-500 hover:bg-emerald-900 text-amber-50 py-1 px-2">
                    Parent: {{ parentTask.title }}
                </RouterLink>
            </p>
            <h3 class="text-lg font-semibold">{{ task.title }}</h3>

            <p class="text-sm"> {{ task.description }} </p>


            <div v-if="childTasks.length > 0" class="text-xs">
                <hr class="my-2" />
                <p>
                    Progress: {{ progressPercentage }}% </p>
                <ul class="m-2 px-2">
                    <li v-for="childTask in childTasks" :key="childTask.id" class="list-disc">
                        <RouterLink :to="`/tasks/${childTask.id}/edit`">
                            {{ backendStore.listsById[childTask.listId]?.name }} - {{ childTask.title }}
                        </RouterLink>
                    </li>
                </ul>
            </div>
        </RouterLink>
    </section>
</template>