<script setup>
import TaskCard from './TaskCard.vue';
import { useBackendStore } from '../services/backendStore';

const backendStore = useBackendStore();

const props = defineProps({
    listId: {
        type: String,
        required: true,
    },
});

const list = backendStore.listsById[props.listId]
</script>

<template>
    <section class="bg-gray-400 rounded-xl w-fit p-4 m-10">
        <h2 class="text-xl font-semibold text-white text-center">{{ list.name }}</h2>
        <div>
            <TaskCard v-for="taskId in list.taskIds" :key="taskId" :id="taskId" />
        </div>
    </section>
</template>