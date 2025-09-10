<script setup>
import { reactive, watchEffect } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useBackendStore } from "../services/backendStore";

const backendStore = useBackendStore()
const toast = useToast();
const router = useRouter()
const route = useRoute()
const id = route.params.id;

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
    isLoaded: false,
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        if (!state.isLoaded) {
            // Only init the form once
            state.task = backendStore.getTask(id)
            form.title = state.task.title;
            form.description = state.task.description;
            form.listId = state.task.listId;
            form.parentTaskId = state.task.parentTaskId;

            console.log("TaskEditView: got task for id", id, JSON.parse(JSON.stringify(state.task)))
        }

        state.parentTask = backendStore.getParentTaskForTask(state.task)
        state.childTasks = backendStore.getChildTasksForTask(state.task)
        state.isLoaded = true
    }
})

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

    backendStore.updateTask(updatedTask);

    toast.success(`Updated task '${updatedTask.title}'`);
    router.push("/");
}
</script>

<template>
    <section class="w-100 m-auto">
        <h2>Edit task (#{{ id }})</h2>

        <form v-if="state.isLoaded" @submit.prevent="handleSubmit()">
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
                    <option v-for="list in backendStore.lists" :key="list.id" :value="list.id">{{
                        list.name }}
                    </option>
                </select>
            </div>

            <div class="mb-4">
                <label for="parentTaskId" class="block text-gray-700 font-bold mb-2">Parent Task ID</label>
                <select v-model="form.parentTaskId" id="parentTaskId" name="parentTaskId"
                    class="border rounded w-full py-2 px-3">
                    <option
                        v-for="parentTask in backendStore.tasks.filter(possibleParentTask => possibleParentTask.id !== id && state.task.childTaskIds.indexOf(possibleParentTask.id) < 0)"
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