<script setup>
import { storeToRefs } from 'pinia';
import { useBackendStore } from '../services/backendStore';
import { onBeforeUpdate, onMounted, reactive } from 'vue';

const backendStore = useBackendStore();

const props = defineProps({
    id: String,
});

const { tasksById, listsById } = storeToRefs(backendStore)

const state = reactive({
    task: {},
    parentTask: {},
    childTasks: [],
    progressPercentage: -1,
    listsById: {},
})

function updateState(state) {
    state.task = tasksById.value[props.id];
    state.parentTask = state.task.parentTaskId === null ? null : tasksById.value[state.task.parentTaskId];
    state.childTasks = state.childTaskIds
        ?.map((childTaskId) => tasksById.value[childTaskId])
        ?.filter((childTask) => childTask !== null)
        || [];

    state.progressPercentage = Math.floor(
        100 *
        state.childTasks.filter(childTask => childTask.listId === '1').length /
        state.childTasks.length
    );

    state.listsById = listsById.value;
}

onMounted(() => {
    updateState(state);
});
onBeforeUpdate(() => {
    updateState(state);
});



console.log("TaskCard: Initialised for ", props.id)

</script>

<template>
    <section v-if="(tasksById.value && listsById.value) || true"
        class="bg-gray-100 hover:bg-gray-200 rounded-md w-60 my-4 border-2 p-4">
        <RouterLink :to="`/tasks/${id}/edit`">
            <p v-if="state.parentTask !== null" class="text-xs mb-2">
                <RouterLink :to="`/tasks/${state.parentTask.id}/edit`"
                    class="rounded-sm bg-emerald-500 hover:bg-emerald-900 text-amber-50 py-1 px-2">
                    Parent: {{ state.parentTask.title }}
                </RouterLink>
            </p>
            <h3 class="text-lg font-semibold">{{ state.task.title }}</h3>

            <p class="text-sm"> {{ state.task.description }} </p>


            <div v-if="state.childTasks.length > 0" class="text-xs">
                <hr class="my-2" />
                <p>
                    Progress: {{ state.progressPercentage }}% </p>
                <ul class="m-2 px-2">
                    <li v-for="childTask in state.childTasks" :key="childTask.id" class="list-disc">
                        <RouterLink :to="`/tasks/${childTask.id}/edit`">
                            {{ state.listsById.value[childTask.listId]?.name }} - {{ childTask.title }}
                        </RouterLink>
                    </li>
                </ul>
            </div>
        </RouterLink>
    </section>
</template>