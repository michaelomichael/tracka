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
    isDone: false,
});

const state = reactive({
    isNew: true,
    task: null,
    parentTask: null,
    childTasks: [],
    isLoaded: false,
})

const listNavigationButtons = []

watchEffect(() => {
    state.isNew = props.taskId == null

    if (backendStore.isLoaded) {
        if (state.task?.id !== props.taskId) {
            // Only init the form once
            if (state.isNew) {
                state.task = {
                    id: null,
                    title: "",
                    description: "",
                    listId: props.listId ?? backendStore.newItemsList.id,
                    parentTaskId: null,
                    childTaskIds: [],
                    isDone: false,
                }
            } else {
                state.task = backendStore.getTask(props.taskId)
            }

            form.title = state.task.title ?? "";
            form.description = state.task.description ?? "";
            form.isDone = state.task.isDone ?? false; // Fallback in case field is missing
            // The 'List' dropdown won't contain 'DONE', so set a sensible value
            // for listId in case the task was originally done and the user then
            // un-checks the checkbox.
            form.listId = state.task.isDone ? 'TODAY' : state.task.listId;
            form.parentTaskId = state.task.parentTaskId ?? null;

            console.log("TaskEditView: got task for id", props.taskId, JSON.parse(JSON.stringify(state.task)))
        }

        if (state.isNew && props.listId != null && state.task?.listId !== props.listId) {
            // TODO: Shouldn't we be setting form.listId as well as (or instead of) this?
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
        title: form.title,
        description: form.description,
        isDone: form.isDone,
        listId: form.isDone ? "DONE" : form.listId,
        parentTaskId: form.parentTaskId === "" ? null : form.parentTaskId,
        childTaskIds: copy(state.task.childTaskIds),
    };

    if (state.isNew) {
        backendStore.addTask(updatedTask)
        toast.success(`Created task '${updatedTask.title}'`);
    } else {
        backendStore.patchTask(state.task.id, updatedTask);
        toast.success(`Updated task '${updatedTask.title}'`);
    }

    router.push("/");
}

function handleDeleteChild(taskId) {
    console.log("TaskEdit.handleDeleteChild: Requested to delete taskId", taskId)
}

function handleAddChild() {
    console.log("TaskEdit.handleAddChild: Requested to add a child task")
}

function handlePromoteChild(taskId) {
    console.log("TaskEdit.handlePromoteChild: Requested to promote taskId", taskId)
}

function handleChange() {
    if (state.isNew) {
        console.log("TaskEdit.handleChange: Task has not yet been created, so won't auto-save")
        return
    }

    const updatedTaskFields = {
        title: form.title,
        description: form.description,
        isDone: form.isDone,
        listId: form.isDone ? "DONE" : form.listId,
        parentTaskId: form.parentTaskId === "" ? null : form.parentTaskId,
    };
    console.log("TaskEdit.handleChange: updatedTaskFields is", updatedTaskFields)

    backendStore.patchTask(state.task.id, updatedTaskFields);
    toast.success(`Updated task '${updatedTaskFields.title}'`);
}

</script>

<template>
    <section class="w-100 m-auto">
        <form v-if="state.isLoaded" @submit.prevent="handleSubmit()">
            <div id="buttons" v-if="state.isNew" class="flex gap-2 items-baseline mb-4">
                <button
                    class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline"
                    type="submit">
                    Create Task
                </button>
                <RouterLink to="/">Cancel</RouterLink>
            </div>

            <div id="list-selection" class="flex gap-2 mb-4 items-stretch">
                <div
                    :class="`rounded-md border-1 px-2 py-2 border-gray-800 flex gap-1 ${form.isDone ? 'bg-green-500' : ''}`">
                    <input type="checkbox" id="done" v-model="form.isDone" @change="handleChange()"
                        v-bind:autofocus="!state.isNew" />
                    <label for="done">Done?</label>
                </div>

                <select v-if="!form.isDone" v-model="form.listId" id="listId" name="listId" @change="handleChange()"
                    class="border rounded w-full py-2 px-3" required>
                    <option v-for="list in backendStore.lists.filter(list => list.id !== 'DONE')" :key="list.id"
                        :value="list.id">{{
                            list.name }}
                    </option>
                </select>
            </div>

            <div id="title-field" class="mb-4">
                <input v-model="form.title" type="text" id="title" name="title" placeholder="Task title"
                    @change="handleChange()" class="border rounded w-full py-2 px-3 mb-2" required
                    v-bind:autofocus="state.isNew" />
            </div>

            <div id="description-field" class="mb-4">
                <textarea v-model="form.description" id="description" name="description" placeholder="Description"
                    @change="handleChange()" class="border rounded w-full py-2 px-3" rows="4"></textarea>
            </div>

            <div id="parent-task-field" class="mb-4 flex gap-2 items-baseline">
                <label for="parentTaskId" class=" text-gray-700 font-bold mb-2">Parent</label>
                <select v-model="form.parentTaskId" id="parentTaskId" name="parentTaskId" @change="handleChange()"
                    class="border rounded w-full py-2 px-3">
                    <option value=""></option>
                    <option
                        v-for="parentTask in backendStore.tasks.filter(possibleParentTask => possibleParentTask.id !== props.taskId && state.task?.childTaskIds.indexOf(possibleParentTask.id) < 0)"
                        :key="parentTask.id" :value="parentTask.id">{{
                        parentTask.title }}
                    </option>
                </select>
            </div>

            <div id="child-tasks-field" class="mb-4" v-if="state.childTasks.length > 0">
                <label for="childTasks" class="block text-gray-700 font-bold mb-2">Child Tasks</label>
                <ul id="childTasks">
                    <li v-for="childTask in state.childTasks" :key="childTask.id" class="flex justify-between">
                        <RouterLink :to="`/tasks/${childTask.id}/edit`">{{ childTask.title }}</RouterLink>
                        <div class="text-xs flex gap-1">
                            <button title="Promote child to parent-less"
                                @click.prevent="handlePromoteChild(childTask.id)"><i
                                    class="pi pi-arrow-up"></i></button>
                            <button title="Delete child task" @click.prevent="handleDeleteChild(childTask.id)"><i
                                    class="pi pi-trash"></i></button>
                        </div>
                    </li>
                </ul>
                <button @click.prevent="handleAddChild()"><i class="pi pi-file-plus"></i></button>
            </div>

        </form>
    </section>
</template>