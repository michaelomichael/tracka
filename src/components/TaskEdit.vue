<script setup>
import { reactive, watchEffect, computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useBackendStore } from "../services/backendStore";
import { copy } from "../services/utils";
import TaskPickerCombo from "./TaskPickerCombo.vue";

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

async function handleAddExistingTaskToChildTasks(childTaskId) {
    console.log("TaskEdit.handleAddExistingTaskToChildTasks: Requested to add a child task with ID:", childTaskId)

    state.task = await backendStore.patchTask(state.task, {
        childTaskIds: [...state.task.childTaskIds, childTaskId]
    })
}

async function handlePromoteChildToParentless(childTaskIdToBePromoted) {
    console.log("TaskEdit.handlePromoteChildToParentless: Requested to promote taskId", childTaskIdToBePromoted)

    state.task = await backendStore.patchTask(state.task, {
        childTaskIds: state.task.childTaskIds.filter(otherChildTaskId => otherChildTaskId !== childTaskIdToBePromoted)
    })
}

async function handleChange() {
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

    await backendStore.patchTask(state.task.id, updatedTaskFields);
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
                <div :class="`rounded-md border-1 p-2 border-gray-800 flex gap-1 ${form.isDone ? 'bg-green-500' : ''}`">
                    <input type="checkbox" id="done" v-model="form.isDone" @change="handleChange()"
                        v-bind:autofocus="!state.isNew" />
                    <label for="done">Done?</label>
                </div>

                <select v-if="!form.isDone" v-model="form.listId" id="listId" name="listId" @change="handleChange()"
                    class="border rounded w-full p-2" required>
                    <option v-for="list in backendStore.lists.filter(list => list.id !== 'DONE')" :key="list.id"
                        :value="list.id">{{
                            list.name }}
                    </option>
                </select>
            </div>

            <div id="title-field" class="mb-4">
                <input v-model="form.title" type="text" id="title" name="title" placeholder="Task title"
                    @change="handleChange()" class="border rounded w-full p-2 mb-2" required
                    v-bind:autofocus="state.isNew" />
            </div>

            <div id="description-field" class="mb-4">
                <textarea v-model="form.description" id="description" name="description" placeholder="Description"
                    @change="handleChange()" class="border rounded w-full p-2" rows="4"></textarea>
            </div>

            <div id="parent-task-field" class="mb-4 flex gap-2 items-baseline">
                <label for="parentTaskId" class=" text-gray-700 font-bold mb-2">Parent</label>
                <select v-model="form.parentTaskId" id="parentTaskId" name="parentTaskId" @change="handleChange()"
                    class="border rounded w-full p-2">
                    <option value=""></option>
                    <option
                        v-for="parentTask in backendStore.tasks.filter(possibleParentTask => possibleParentTask.id !== props.taskId && state.task?.childTaskIds.indexOf(possibleParentTask.id) < 0)"
                        :key="parentTask.id" :value="parentTask.id">{{
                            parentTask.title }}
                    </option>
                </select>
            </div>

            <div id="child-tasks-field" class="mb-4">
                <label for="childTasks" class="block text-gray-700 font-bold mb-2">Child Tasks</label>
                <ul id="childTasks" v-if="state.childTasks.length">
                    <li v-for="childTask in state.childTasks" :key="childTask.id"
                        class="flex bullets justify-between flex-nowrap items-baseline">
                        <RouterLink :to="`/tasks/${childTask.id}/edit`" class="text-link">
                            {{ childTask.title }}
                        </RouterLink>
                        <span class="text-xs flex gap-1">
                            <button title="Promote child to be parent-less"
                                class="cursor-pointer rounded-4xl hover:bg-orange-50 w-6 h-6"
                                @click.prevent=" handlePromoteChildToParentless(childTask.id)">
                                <i class="pi pi-angle-double-up"></i>
                            </button>
                        </span>
                    </li>
                </ul>
                <div>
                    <TaskPickerCombo placeholder-text="Search for (or create) child task..."
                        :excluded-task-ids="taskId == null ? [] : [taskId]" :exclude-done-tasks="true"
                        :exclude-tasks-with-parents="true" @task-id-selected="handleAddExistingTaskToChildTasks" />
                </div>
            </div>

        </form>
    </section>
</template>