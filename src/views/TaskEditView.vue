<script setup>
import backend from "@/services/backend"
import { onMounted, onUnmounted, reactive } from "vue";
import TaskList from "../components/TaskList.vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();

const route = useRoute();
const id = route.params.id;

const toast = useToast();

const state = reactive({
    allListsById: {},
    allTasksById: {},
    task: null,
    parentTask: null,
    childTasks: [],
    isLoading: true,
});

const form = reactive({
    title: "",
    description: "",
    listId: "",
    parentTaskId: "",
});

onMounted(() => {
    console.log("Backend is ", backend);
    //state.allListsById = backend.getLists();

    onUnmounted(backend.getAndWatchLists(state.allListsById));
    onUnmounted(backend.getAndWatchTasks(state.allTasksById));
    state.allTasksById = backend.getTasks();
    state.task = backend.getTask(id);

    state.parentTask = state.task.parentTaskId ? state.allTasksById[state.task.parentTaskId] : null;
    state.childTasks = state.task.childTaskIds.map(childTaskId => state.allTasksById[childTaskId]);

    form.title = state.task.title;
    form.description = state.task.description;
    form.listId = state.task.listId;
    form.parentTaskId = state.task.parentTaskId;

    console.log("Loaded task", id, state.task);
    state.isLoading = false;
});

const handleSubmit = () => {
    const updatedTask = {
        id: state.task.id,
        title: form.title,
        description: form.description,
        listId: form.listId,
        parentTaskId: form.parentTaskId,
        childTaskIds: state.task.childTaskIds,
    };

    const oldList = state.allListsById[state.task.listId];
    const newList = state.allListsById[updatedTask.listId];

    if (newList === null) {
        throw (`Can't find new list with ID ${updatedTask.listId}`);
    }

    const oldParentTaskId = state.task.parentTaskId;

    backend.updateTask(updatedTask);

    // If the listId has changed, update the old and new lists too.
    // This could probably be done automatically inside backend.js
    if (oldList?.id !== newList.id) {
        if (oldList !== null) {
            oldList.taskIds = oldList.taskIds.filter(otherTaskId => otherTaskId !== id);
            backend.updateList(oldList);
        }
        if (newList.taskIds.indexOf(id) < 0) {
            newList.taskIds.unshift(id);
            backend.updateList(newList);
        }
    }

    // If the parentTaskId has changed then we need to remove it from the 
    // old parent task's list of children, and add it to the new one.
    if (oldParentTaskId !== updatedTask.parentTaskId) {
        // TODO
    }

    toast.success(`Updated task '${updatedTask.title}'`);
    router.push("/");

};
</script>

<template>
    <section class="w-100 m-auto">
        <h2>Edit task (#{{ id }})</h2>

        <form v-if="!state.isLoading" @submit.prevent="handleSubmit()">
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
                    <option v-for="list in Object.values(state.allListsById)" :key="list.id" :value="list.id">{{
                        list.name }}
                    </option>
                </select>
            </div>

            <div class="mb-4">
                <label for="parentTaskId" class="block text-gray-700 font-bold mb-2">Parent Task ID</label>
                <select v-model="form.parentTaskId" id="parentTaskId" name="parentTaskId"
                    class="border rounded w-full py-2 px-3">
                    <option
                        v-for="parentTask in Object.values(state.allTasksById).filter(possibleParentTask => possibleParentTask.id !== id && state.task.childTaskIds.indexOf(possibleParentTask.id) < 0)"
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
        <p v-else>Loading...</p>
    </section>
</template>