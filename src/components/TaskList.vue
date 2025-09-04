<script setup>
import Task from './Task.vue';


defineProps({
    list: {
        type: Object,
        required: true,
    },
});



</script>

<template>
    <section class="bg-amber-500 rounded-lg w-fit p-4 m-10">
        <h2 class="text-xl font-semibold">{{ list.name }}</h2>
        <div>
            <Task v-for="taskId in list.taskIds" :key="taskId" :id="taskId" />
        </div>
    </section>
</template>