<script setup>
import TaskCard from './TaskCard.vue';
import { useBackendStore } from '../services/backendStore';
import { storeToRefs } from 'pinia';
import { onBeforeUpdate, onMounted, reactive } from 'vue';

const backendStore = useBackendStore();
const { listsById } = storeToRefs(backendStore)

const props = defineProps({
    listId: {
        type: String,
        required: true,
    },
});

const state = reactive({
    list: {},
})

onMounted(() => {
    state.list = listsById.value[props.listId]
});

onBeforeUpdate(() => {
    state.list = listsById.value[props.listId]
});

console.log("TaskList: listsByIdRef is ", JSON.stringify(listsById.value))
</script>

<template>
    <section v-if="(state.list && listsById.value) || state.list" class="bg-gray-400 rounded-xl w-fit p-4 m-10">
        <h2 class="text-xl font-semibold text-white text-center">{{ state.list.name }}</h2>
        <div v-if="listsById.value || true">
            <TaskCard v-for="taskId in (state.list?.taskIds || [])" :key="taskId" :id="taskId" />
        </div>
    </section>
</template>