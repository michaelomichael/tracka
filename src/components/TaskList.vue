<script setup>
import draggable from "vuedraggable";
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
    taskIdsSortableList: [],
    list: {},
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.list = backendStore.getList(props.listId)

        const searchString = route.query.search?.trim()

        if (searchString != null && searchString.length > 0) {
            state.isFiltered = true
            state.searchString = searchString
            const searchStringLowerCase = searchString.toLocaleLowerCase()
            state.taskIdsSortableList = state.list.taskIds.filter(taskId =>
                taskMatches(backendStore.getTask(taskId), searchStringLowerCase)
            )
        } else {
            state.isFiltered = false
            state.searchString = null
            state.taskIdsSortableList = state.list.taskIds; // v-model won't change the original state.list.taskIds :)
        }

        state.isLoaded = true
    }
})

function taskMatches(task, searchStringLowerCase) {
    return task.title.toLocaleLowerCase().indexOf(searchStringLowerCase) >= 0 ||
        task.description.toLocaleLowerCase().indexOf(searchStringLowerCase) >= 0
}

function handleTaskMovedToThisList(evt) {
    const taskId = evt.clone.getAttribute("data-task-id");
    console.log(`TaskList[${props.listId}].handleTaskMovedToThisList: taskId=`, taskId);

    // If this is the DONE list, then we want to make sure that the task's `isDone` flag
    // is set to true. In other cases, make sure it's set to false.
    // 
    // Move the task to its new list first. This will automatically update the taskIds array in both the old and new lists,
    // albeit the task will be inserted at the start of the new list.
    backendStore.patchTask(taskId, { listId: props.listId, isDone: props.listId === "DONE" });

    // Now set the correct order of tasks in the new list.
    backendStore.patchList(state.list, { taskIds: state.taskIdsSortableList });
}

function handleTaskOrderChanged() {
    console.log(`TaskList[${props.listId}].handleTaskOrderChanged: original order=`, JSON.stringify(state.list.taskIds), " new order=", JSON.stringify(state.taskIdsSortableList));
    backendStore.patchList(state.list, { taskIds: state.taskIdsSortableList });
}
function handleDragStart() {
    console.log(`TaskList[${props.listId}].handleDragStart`)
    document.body.classList.add("dragging")
}
function handleDragEnd() {
    console.log(`TaskList[${props.listId}].handleDragEnd`)
    document.body.classList.remove("dragging")
}
// TODO: Make the `snap-center` work when dragging
</script>

<template>
    <draggable v-if="state.isLoaded && (state.taskIdsSortableList.length > 0 || !state.isFiltered)"
        class="rounded-xl w-70 min-w-70 p-4 m-6 relative bg-gray-400 xsnap-center" :data-list-id="props.listId"
        v-model="state.taskIdsSortableList" tag="section" group="task-cards-onto-lists" itemKey="this"
        @add="handleTaskMovedToThisList" @update="handleTaskOrderChanged" animation="200" delay="300"
        delayOnTouchOnly="true" forceAutoScrollFallback="true" xforceFallback="true" xscrollSensitivity="360"
        xscrollSpeed="460" revertOnSpill="true" @start="handleDragStart" @end="handleDragEnd">
        <template #header>
            <h2 class="sticky top-0 text-xl font-semibold text-white text-center bg-gray-400">
                {{ state.list.name }}
            </h2>

            <!-- "Add Task" button: -->
            <RouterLink :to="`/tasks/new?listId=${state.list.id}`"
                class="border-gray-500 border-1 cursor-pointer bg-gray-200 hover:bg-blue-400 fully-centered-children p-1.5 rounded-md absolute right-4 top-4">
                <i class="pi pi-plus"></i>
            </RouterLink>
        </template>
        <template #item="{ element }">
            <TaskCard :taskId="element" />
        </template>
    </draggable>
</template>

<style scoped>
.flip-list-move {
    transition: transform 0.5s;
}

.no-move {
    transition: transform 0s;
}

/* Styles for the placeholder spot where the dragged item would be inserted into the list if it were to be 
   dropped at its current coordinates */
.sortable-ghost {
    background: transparent !important;
    color: transparent;
    outline-offset: 1px;
    outline-width: 3px;
    outline-style: dashed;
    outline-color: black;
    /* TODO: Different colours for when it's dark mode */
}

.sortable-ghost * {
    opacity: 0;
}

.sortable-fallback {
    opacity: 0.5;
    background: aliceblue !important;
}

.xsortable-chosen {
    opacity: 0.5;
    background: red !important;
}

/* Styles for the item when it's being dragged around the screen */
.sortable-drag {
    opacity: 0.7;
    xtransform: scale(0.5) !important;
    cursor: move;
    background: orange !important;
}
</style>