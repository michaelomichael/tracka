<script setup>
import TaskCard from './TaskCard.vue';
import { useBackendStore } from '../services/backendStore';
import { storeToRefs } from 'pinia';
import { onBeforeUpdate, onMounted, reactive, watchEffect } from 'vue';

const backendStore = useBackendStore();
// const { listsById } = storeToRefs(backendStore)

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
        state.list = backendStore.listsById[props.listId]
        state.isLoaded = true
    }
})
// onMounted(() => {
//     state.list = listsById.value[props.listId]
// });

// onBeforeUpdate(() => {
//     state.list = listsById.value[props.listId]
// });

// console.log("TaskList: listsByIdRef is ", JSON.stringify(listsById.value))
</script>

<template>
    <section v-if="state.isLoaded" class="bg-gray-400 rounded-xl w-fit p-4 m-10">
        <h2 class="text-xl font-semibold text-white text-center">{{ state.list.name }}</h2>
        <TaskCard v-for="taskId in (state.list.taskIds || [])" :key="taskId" :id="taskId" />
    </section>
</template>