<script setup>
import { reactive, watchEffect } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useBackendStore } from "../services/backendStore";
import { copy } from "../services/utils";

const backendStore = useBackendStore()
const toast = useToast();
const router = useRouter()

const props = defineProps({
    taskId: {
        type: String,
        required: false,
    },
    listId: {
        type: String,
        required: false,
    },
})

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
        if (state.task?.id !== props.taskId) {
            // Only init the form once
            if (props.taskId == null) {
                state.task = {
                    id: null,
                    title: "",
                    description: "",
                    listId: props.listId ?? backendStore.newItemsList.id,
                    parentTaskId: null,
                    childTaskIds: [],
                }
            } else {
                state.task = backendStore.getTask(props.taskId)
            }
            form.title = state.task.title;
            form.description = state.task.description;
            form.listId = state.task.listId;
            form.parentTaskId = state.task.parentTaskId;

            console.log("TaskEditView: got task for id", props.taskId, JSON.parse(JSON.stringify(state.task)))
        }

        if (props.listId != null && state.task?.listId !== props.listId) {
            state.task.listId = props.listId
        }

        state.parentTask = backendStore.getParentTaskForTask(state.task)
        state.childTasks = backendStore.getChildTasksForTask(state.task)
        state.isLoaded = true
    }
})

const handleSubmit = () => {
    console.log("TaskEditView: Submitting")
    const updatedTask = {
        id: state.task.id,
        title: form.title,
        description: form.description,
        listId: form.listId,
        parentTaskId: form.parentTaskId === "" ? null : form.parentTaskId,
        childTaskIds: copy(state.task.childTaskIds),
    };

    if (updatedTask.id === null) {
        backendStore.addTask(updatedTask)
        toast.success(`Created task '${updatedTask.title}'`);
    } else {
        backendStore.updateTask(updatedTask);
        toast.success(`Updated task '${updatedTask.title}'`);
    }
    // TODO: clear the form?

    router.push("/");
}
</script>

<template>
    <section class="w-100 m-auto">
        <h2>Edit task (#{{ props.taskId }})</h2>

        <form v-if="state.isLoaded" @submit.prevent="handleSubmit()">
            <h2 class="text-3xl text-center font-semibold mb-6">{{ props.taskId == null ? "Create" : "Edit" }} Task</h2>

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
                <label for="parentTaskId" class="block text-gray-700 font-bold mb-2">Parent Task ID</label>
                <select v-model="form.parentTaskId" id="parentTaskId" name="parentTaskId"
                    class="border rounded w-full py-2 px-3">
                    <option value=""></option>
                    <option
                        v-for="parentTask in backendStore.tasks.filter(possibleParentTask => possibleParentTask.id !== props.taskId && state.task?.childTaskIds.indexOf(possibleParentTask.id) < 0)"
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

            <div class="flex gap-2 items-baseline">
                <button
                    class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline"
                    type="submit">
                    Save Task
                </button>
                <RouterLink to="/">Cancel</RouterLink>
            </div>
        </form>
    </section>
</template>