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
    <section v-if="state.isLoaded" class="bg-gray-400 rounded-xl w-70  p-4 m-10 relative">
        <h2 class="text-xl font-semibold text-white text-center">{{ state.list.name }}</h2>
        <RouterLink :to="`/tasks/new?listId=${state.list.id}`">
            <button
                class="border-gray-500 border-1 cursor-pointer bg-gray-200 hover:bg-blue-400 px-1 rounded-md absolute right-4 top-4"><i
                    class="pi pi-plus"></i></button>
        </RouterLink>
        <TaskCard v-for="taskId in (state.list.taskIds || [])" :key="taskId" :taskId="taskId" />
    </section>
</template>