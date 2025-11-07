<script setup>
import { computed, reactive } from 'vue';
import { useBackendStore } from '../services/backendStore';
import { useLogger } from '../services/logger';

/*
This component renders as a textbox which allows you to select an existing task Id or to type
in your own new one which will be created in the background (in the "backendStore.newTasksList" list).

As you're typing, it'll display an autocomplete list with potential matches.
If there are no _exact_ matches, then the first (default) item in the autocomplete list is
`<The text you entered> (create task)`
*/
const props = defineProps({
    placeholderText: {
        type: String,
        required: false,
        default: "",
    },
    excludeTasksWithParents: {
        type: Boolean,
        required: false,
        default: false,
    },
    excludeTasksWithChildren: {
        type: Boolean,
        required: false,
        default: false,
    },
    excludeDoneTasks: {
        type: Boolean,
        required: false,
        default: false,
    },
    excludedTaskIds: {
        type: Array,
        required: false,
        default: [],
    },
})

const emit = defineEmits(["task-id-selected"])

const { log } = useLogger()
const backendStore = useBackendStore()

const state = reactive({
    searchTerm: "",
    highlightedMatchIndex: 2,
})

const searchResults = computed(() => {
    const searchTerm = state.searchTerm.trim()
    const searchTermLowerCase = searchTerm.toLowerCase()

    state.highlightedMatchIndex = 0

    if (searchTerm === "") {
        return {
            numOverallMatches: 0,
            numDisplayedMatches: 0,
            items: [],
        }
    }

    const invalidTaskIds = new Set(props.excludedTaskIds ?? [])
    // TODO: Make this more efficient. Want to take the first 10 "normal" matches, excluding 

    const allMetaTasks = backendStore.tasks.map(task => {
        if (task.isDone && props.excludeDoneTasks) {
            return null
        }
        if (task.parentTaskId != null && props.excludeTasksWithParents) {
            return null
        }
        if ((task.childTaskIds ?? []).length > 0 && props.excludeTasksWithChildren) {
            return null
        }

        const titleLowerCase = task.title.toLowerCase()
        const matchIndex = titleLowerCase.indexOf(searchTermLowerCase)
        const matchType = matchIndex < 0
            ? "NONE"
            : (matchIndex === 0 && titleLowerCase.length === searchTermLowerCase.length
                ? "FULL"
                : "PARTIAL"
            )

        return {
            task: task,
            isInvalid: (invalidTaskIds.has(task.id)),
            matchType: matchType,
            listName: backendStore.getListForTask(task).name,
        }
    }).filter(task => task != null)

    const validPartialMatches = allMetaTasks.filter(metaTask => metaTask.matchType === "PARTIAL" && !metaTask.isInvalid)
    const validFullMatches = allMetaTasks.filter(metaTask => metaTask.matchType === "FULL" && !metaTask.isInvalid)

    const topTenMatches = validFullMatches.concat(validPartialMatches).slice(0, 10)

    const fakeCreateNewMatch = {
        taskId: null,
        taskTitle: state.searchTerm,
        listName: null,
        isCreate: true,
    }

    return {
        numOverallMatches: validPartialMatches.length + validFullMatches.length,
        numDisplayedMatches: topTenMatches.length,
        items: [
            fakeCreateNewMatch,
            ...topTenMatches.map(match => (
                {
                    taskId: match.task.id,
                    taskTitle: match.task.title,
                    listName: match.listName,
                    isCreate: false,
                }
            ))
        ]
    }
})

async function selectMatch(match) {
    log("selectMatch:", match)

    if (match.taskId != null) {
        emit("task-id-selected", match.taskId)
    } else {
        const newTask = await backendStore.addTask({
            title: match.taskTitle,
            listId: backendStore.newItemsList.id,
        })
        log("selectMatch: Created a new task:", newTask)
        emit("task-id-selected", newTask.id)
    }

    state.searchTerm = ""
}
function selectHighlightedMatch() {
    const items = searchResults.value.items
    if (items.length > 0 && state.highlightedMatchIndex < items.length) {
        const match = items[state.highlightedMatchIndex]
        selectMatch(match)
    }
}

function highlightNextMatch() {
    if (state.highlightedMatchIndex < searchResults.value.items.length - 1) {
        state.highlightedMatchIndex++
    }
}
function highlightPreviousMatch() {
    if (state.highlightedMatchIndex > 0) {
        state.highlightedMatchIndex--
    }
}
</script>


<template>
    <div class="w-full">
        <input type="text" placeholder="Search for (or create) task..." v-model="state.searchTerm"
            v-on:keydown.enter.prevent="selectHighlightedMatch()" v-on:keydown.down.prevent="highlightNextMatch()"
            v-on:keydown.up.prevent="highlightPreviousMatch()" class="w-full px-2 py-1 border-1 " />

        <ul v-if="searchResults.items.length" class="border-1 border-gray-500">
            <li class="px-1 font-semibold"> Showing {{ searchResults.items.length }} of {{ backendStore.tasks.length }}
                matching
                tasks
            </li>
            <li v-for="(match, index) in searchResults.items" :key="match" @click="selectMatch(match)"
                :class="`flex justify-between border-t-1 border-t-gray-400 p-1 ${state.highlightedMatchIndex === index ? 'bg-amber-400' : ''}`">
                <span>{{ match.taskTitle }} </span>
                <span v-if="match.isCreate" class="text-sm bg-yellow-300 text-red-800 italic px-2 py-0.5">Create</span>
                <span v-else class="text-sm italic text-gray-600">(in {{ match.listName }})</span>
            </li>
        </ul>
    </div>
</template>