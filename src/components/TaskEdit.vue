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
    task: null,
    parentTask: null,
    childTasks: [],
    isLoaded: false,
})

const listNavigationButtons = []

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
                    isDone: false,
                }
            } else {
                state.task = backendStore.getTask(props.taskId)
            }
            form.title = state.task.title;
            form.description = state.task.description;
            form.isDone = state.task.isDone;
            // The 'List' dropdown won't contain 'DONE', so set a sensible value
            // for listId in case the task was originally done and the user then
            // un-checks the checkbox.
            form.listId = state.task.isDone ? 'TODAY' : state.task.listId;
            form.parentTaskId = state.task.parentTaskId;

            console.log("TaskEditView: got task for id", props.taskId, JSON.parse(JSON.stringify(state.task)))
        }

        if (props.listId != null && state.task?.listId !== props.listId) {
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
        id: state.task.id,
        title: form.title,
        description: form.description,
        isDone: form.isDone,
        listId: form.isDone ? "DONE" : form.listId,
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

const setList = (listId) => {
    form.listId = listId
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
</script>

<template>
    <section class="w-100 m-auto">
        <!-- TODO: Ditch the "Save" and "Close" buttons, and just save when a field loses focus? 
                    What about new tasks, though? If you start creating a new task and then change your mind?
                    I guess that we'd only save it if the fields are valid. (For now, that just means the title 
                    has to be non-blank.)

        -->
        <form v-if="state.isLoaded" @submit.prevent="handleSubmit()">
            <div id="list" class="flex gap-2 xitems-baseline mb-4 items-stretch">
                <div
                    :class="`rounded-md border-1 px-2 py-2 border-gray-800 flex gap-1 ${form.isDone ? 'bg-green-500' : ''}`">
                    <input type="checkbox" id="done" v-model="form.isDone" />
                    <label for="done">Done?</label>
                </div>

                <!-- TODO: Might be nicer to have a checkbox for "done", plus arrows to move left and right. -->
                <!-- TODO: Consider having a separate "isDone" field, and a "move all done items to done" button -->
                <!-- <button v-for="listId of listNavigationButtons"
                        :class="`text-sm text-white font-semibold bg-gray-400 cursor-pointer rounded-sm xbg-green-600 px-2 ${form.listId === listId ? 'bg-green-700' : ''}`"
                        @click.prevent="setList(listId)">{{ backendStore.getList(listId).name }}</button> -->

                <select v-if="!form.isDone" v-model="form.listId" id="listId" name="listId"
                    class="border rounded w-full py-2 px-3" required>
                    <option v-for="list in backendStore.lists.filter(list => list.id !== 'DONE')" :key="list.id"
                        :value="list.id">{{
                            list.name }}
                    </option>
                </select>
            </div>

            <div class="mb-4">
                <input v-model="form.title" type="text" id="title" name="title" placeholder="Task title"
                    class="border rounded w-full py-2 px-3 mb-2" required />
            </div>
            <div class="mb-4">
                <textarea v-model="form.description" id="description" name="description" placeholder="Description"
                    class="border rounded w-full py-2 px-3" rows="4"></textarea>
            </div>

            <div class="mb-4 flex gap-2 items-baseline">
                <label for="parentTaskId" class=" text-gray-700 font-bold mb-2">Parent</label>
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