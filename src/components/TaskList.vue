<script setup>
import TaskCard from './TaskCard.vue';
import { useBackendStore } from '../services/backendStore';
import { reactive, watchEffect } from 'vue';

const backendStore = useBackendStore();

const props = defineProps({
    listId: {
        type: String,
        required: true,
    },
});

const state = reactive({
    isLoaded: false,
    list: {},
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.list = backendStore.getList(props.listId)
        state.isLoaded = true
    }
})
</script>

<template>
    <section v-if="state.isLoaded" class="bg-gray-400 rounded-xl w-fit p-4 m-10">
        <h2 class="text-xl font-semibold text-white text-center">{{ state.list.name }}</h2>
        <TaskCard v-for="taskId in (state.list.taskIds || [])" :key="taskId" :id="taskId" />
    </section>
</template>