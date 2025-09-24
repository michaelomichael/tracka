<script setup>
import TaskCard from './TaskCard.vue';
import { useBackendStore } from '../services/backendStore';
import { reactive, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const backendStore = useBackendStore();
const route = useRoute()

const props = defineProps({
    listId: {
        type: String,
        required: true,
    },
});

const state = reactive({
    isLoaded: false,
    isFiltered: false,
    searchString: null,
    taskIds: [],
    list: {},
    isTaskBeingDraggedOver: false,
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.list = backendStore.getList(props.listId)

        const searchString = route.query.search?.trim()

        if (searchString != null && searchString.length > 0) {
            state.isFiltered = true
            state.searchString = searchString
            const searchStringLowerCase = searchString.toLocaleLowerCase()
            state.taskIds = state.list.taskIds.filter(taskId =>
                taskMatches(backendStore.getTask(taskId), searchStringLowerCase)
            )
        } else {
            state.isFiltered = false
            state.searchString = null
            state.taskIds = state.list.taskIds
        }
        state.isLoaded = true
    }
})

function taskMatches(task, searchStringLowerCase) {
    return task.title.toLocaleLowerCase().indexOf(searchStringLowerCase) >= 0 ||
        task.description.toLocaleLowerCase().indexOf(searchStringLowerCase) >= 0
}

function handleDragEnter(evt, item) {
    state.isTaskBeingDraggedOver = true
}

function handleDragOver(evt, item) {
    state.isTaskBeingDraggedOver = true
}

function handleDragLeave(evt, item) {
    state.isTaskBeingDraggedOver = false
}

function handleDrop(evt, item) {
    const taskId = evt.dataTransfer.getData('taskId')
    console.log("TaskList.handleDrop: Task ID", taskId, evt)
    state.isTaskBeingDraggedOver = false

    const task = backendStore.getTask(taskId)
    // TODO: updateTask should take an existing task (or taskId) plus an object with only those fields to be updated. 
    // Could call it 'patch'?
    backendStore.patchTask(task, {
        listId: state.list.id,
    })
}
</script>

<template>
    <section v-if="state.isLoaded && (state.taskIds.length > 0 || !state.isFiltered)"
        @dragover.prevent="handleDragOver($event)" @dragenter.prevent="handleDragEnter($event)"
        @dragleave.prevent="handleDragLeave($event)" @drop="handleDrop($event)"
        :class="` rounded-xl w-70  p-4 m-6 relative ${state.isTaskBeingDraggedOver ? 'bg-amber-400' : 'bg-gray-400'}`">
        <h2
            :class="`sticky top-0 text-xl font-semibold text-white text-center ${state.isTaskBeingDraggedOver ? 'bg-amber-400' : 'bg-gray-400'}`">
            {{ state.list.name }}</h2>
        <RouterLink :to="`/tasks/new?listId=${state.list.id}`"
            class="border-gray-500 border-1 cursor-pointer bg-gray-200 hover:bg-blue-400 px-1 rounded-md absolute right-4 top-4">
            <i class="pi pi-plus"></i>
        </RouterLink>
        <TaskCard v-for="taskId in (state.taskIds || [])" :key="taskId" :taskId="taskId" />
    </section>
</template>