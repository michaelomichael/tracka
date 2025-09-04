<script setup>
import TaskCard from './TaskCard.vue';

defineProps({
    list: {
        type: Object,
        required: true,
    },
});
</script>

<template>
    <section class="bg-gray-400 rounded-xl w-fit p-4 m-10">
        <h2 class="text-xl font-semibold text-white text-center">{{ list.name }}</h2>
        <div>
            <TaskCard v-for="taskId in list.taskIds" :key="taskId" :id="taskId" />
        </div>
    </section>
</template>