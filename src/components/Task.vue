<script setup>
import { onMounted, reactive } from 'vue';
import backend from '../services/backend';


const props = defineProps({
    id: String,
});

const state = reactive({
    task: {},
    isLoading: true,
});

onMounted(() => {
    console.log("Loading task with id", props.id);
    state.task = backend.getTask(props.id);
    state.isLoading = false;
});
</script>

<template>
    <section class="bg-amber-100 rounded-md w-60 my-4 border-2 p-4">
        <RouterLink v-if="!state.isLoading" :to="`/tasks/${id}/edit`">
            <h3 class="text-lg font-semibold">{{ state.task.title }}</h3>
            <p class="text-sm">{{ state.task.description }}</p>
        </RouterLink>
        <p v-else>Loading...</p>
    </section>
</template>