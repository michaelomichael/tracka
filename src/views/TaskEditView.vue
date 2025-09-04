<script setup>
import backend from "@/services/backend"
import { onMounted, reactive } from "vue";
import TaskList from "../components/TaskList.vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const router = useRouter();

const route = useRoute();
const id = route.params.id;

const toast = useToast();

const state = reactive({
    lists: [],
    task: {},
    isLoading: true,
});

const form = reactive({
    title: "",
    description: "",
    listId: "",
});

onMounted(() => {
    console.log("Backend is ", backend);
    state.lists = backend.getLists();
    state.task = backend.getTask(id);

    form.title = state.task.title;
    form.description = state.task.description;
    form.listId = state.task.listId;


    console.log("Loaded task", id, state.task);
    state.isLoading = false;
});

const handleSubmit = () => {
    const updatedTask = {
        id: state.task.id,
        title: form.title,
        description: form.description,
        listId: form.listId,
    };

    const oldList = state.lists[state.task.listId];
    const newList = state.lists[updatedTask.listId];

    if (newList === null) {
        throw (`Can't find new list with ID ${updatedTask.listId}`);
    }

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

    toast.success(`Updated task '${updatedTask.title}'`);
    router.push("/");

};
</script>

<template>
    <section>
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
                    <option v-for="list in Object.values(state.lists)" :key="list.id" :value="list.id">{{ list.name }}
                    </option>
                </select>
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