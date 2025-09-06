<script setup>
import { onMounted, onUnmounted, reactive } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useBackendStore } from "../services/backendStore";
import { storeToRefs } from "pinia";

const router = useRouter()

const backendStore = useBackendStore()

const route = useRoute()
const id = route.params.id;

const toast = useToast();

const refs = storeToRefs(backendStore)
const tasksByIdRef = refs.tasksById
const listsByIdRef = refs.listsById




const form = reactive({
    title: "",
    description: "",
    listId: "",
    parentTaskId: "",
});

const state = reactive({
    task: null,
    parentTask: null,
    childTasks: [],
    lists: [],
    tasks: [],
})

onMounted(() => {
    state.lists = listsByIdRef.value ? Object.values(listsByIdRef.value) : []
    state.tasks = tasksByIdRef.value ? Object.values(tasksByIdRef.value) : []

    const task = tasksByIdRef.value[id]
    state.task = task

    if (!task) {
        console.warn("TaskEditView.onMounted: don't yet have task with ID ", id);
        return;
    }
    console.log("TaskEditView: got task for id", id, JSON.parse(JSON.stringify(task)))
    state.parentTask = task.parentTaskId === null ? null : tasksByIdRef.value[task.parentTaskId]
    // TODO: Make this a method on the store
    state.childTasks = task.childTaskIds
        .map((childTaskId) => tasksByIdRef.value[childTaskId])
        .filter((childTask) => childTask !== null)
    form.title = task.title;
    form.description = task.description;
    form.listId = task.listId;
    form.parentTaskId = task.parentTaskId;
});

function copyList(list) {
    const newList = {
        id: list.id,
        name: list.name,
        taskIds: JSON.parse(JSON.stringify(list.taskIds)),
    }
    console.log("Copying list", list, "with result", newList);
    return newList;
}

function copy(anything) {
    return JSON.parse(JSON.stringify(anything));
}

const handleSubmit = () => {
    console.log("TaskEditView: Submitting")
    const updatedTask = {
        id: state.task.id,
        title: form.title,
        description: form.description,
        listId: form.listId,
        parentTaskId: form.parentTaskId,
        childTaskIds: copy(state.task.childTaskIds),
    };

    // const oldList = listsByIdRef.value[task.listId];
    // const newList = listsByIdRef.value[updatedTask.listId];

    // if (newList === null) {
    //     throw (`Can't find new list with ID ${updatedTask.listId}`);
    // }

    // const oldParentTaskId = task.parentTaskId;

    backendStore.updateTask(updatedTask);

    // // If the listId has changed, update the old and new lists too.
    // // This could probably be done automatically inside backend.js
    // if (oldList?.id !== newList.id) {
    //     if (oldList !== null) {
    //         const updatedOldList = copyList(oldList)
    //         updatedOldList.taskIds = updatedOldList.taskIds.filter(otherTaskId => otherTaskId !== id);
    //         backendStore.updateList(updatedOldList);
    //     }
    //     if (newList.taskIds.indexOf(id) < 0) {
    //         const updatedNewList = copyList(newList);
    //         updatedNewList.taskIds.unshift(id);
    //         backendStore.updateList(updatedNewList);
    //     }
    // }

    // // If the parentTaskId has changed then we need to remove it from the 
    // // old parent task's list of children, and add it to the new one.
    // if (oldParentTaskId !== updatedTask.parentTaskId) {
    //     // TODO
    // }

    toast.success(`Updated task '${updatedTask.title}'`);
    router.push("/");

};
</script>

<template>

    <section class="w-100 m-auto">
        <h2>Edit task (#{{ id }})</h2>

        <form @submit.prevent="handleSubmit()">
            <h2 class="text-3xl text-center font-semibold mb-6">Edit Job</h2>

            <div class="mb-4">
                <label class="block text-gray-700 font-bold mb-2">Title</label>
                <input v-model="form.title" type="text" id="title" name="title"
                    class="border rounded w-full py-2 px-3 mb-2" required />
            </div>
            <div class="mb-4">
                <label for="description" class="block text-gray-700 font-bold mb-2">Description</label>
                <textarea v-model="form.description" id="description" name="description"
                    class="border rounded w-full py-2 px-3" rows="4"></textarea>
            </div>

            <div class="mb-4">
                <label for="listId" class="block text-gray-700 font-bold mb-2">List</label>
                <select v-model="form.listId" id="listId" name="listId" class="border rounded w-full py-2 px-3"
                    required>
                    <option v-for="list in state.lists" :key="list.id" :value="list.id">{{
                        list.name }}
                    </option>
                </select>
            </div>

            <div class="mb-4">
                <label for="parentTaskId" class="block text-gray-700 font-bold mb-2">Parent Task ID</label>
                <select v-model="form.parentTaskId" id="parentTaskId" name="parentTaskId"
                    class="border rounded w-full py-2 px-3">
                    <option
                        v-for="parentTask in state.tasks.filter(possibleParentTask => possibleParentTask.id !== id && state.task.childTaskIds.indexOf(possibleParentTask.id) < 0)"
                        :key="parentTask.id" :value="parentTask.id">{{
                            parentTask.title }}
                    </option>
                </select>
            </div>

            <div class="mb-4" v-if="state.childTasks.length > 0">
                <label for="childTasks" class="block text-gray-700 font-bold mb-2">Child Tasks</label>
                <ul id="childTasks">
                    <li v-for="childTask in state.childTasks" :key="childTask.id">
                        <RouterLink :to="`/tasks/${childTask.id}/edit`">{{ childTask.title }}</RouterLink>
                    </li>
                </ul>
            </div>

            <div>
                <button
                    class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline"
                    type="submit">
                    Save Task
                </button>
            </div>
        </form>
    </section>
</template>