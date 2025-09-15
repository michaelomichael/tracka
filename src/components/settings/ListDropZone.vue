<script setup>
import { reactive } from 'vue';
import { useBackendStore } from '../../services/backendStore';


const backendStore = useBackendStore()

const props = defineProps({
    index: Number,
})

const state = reactive({
    isListBeingDraggedOver: false,
})

function handleDragEnter(evt, item) {
    if (isListDraggingEvent(evt)) {
        state.isListBeingDraggedOver = true
    }
}

function handleDragOver(evt, item) {
    if (isListDraggingEvent(evt)) {
        state.isListBeingDraggedOver = true
    }
}

function handleDragLeave(evt, item) {
    if (isListDraggingEvent(evt)) {
        state.isListBeingDraggedOver = false
    }
}

function handleDrop(evt, item) {
    const listId = evt.dataTransfer.getData('listId')
    if (isListDraggingEvent(evt)) {
        console.log("ListDropZone.handleDrop: List ID", listId, evt)
        state.isListBeingDraggedOver = false

        // TODO: reorder lists
    }
}

function isListDraggingEvent(evt) {
    return evt.dataTransfer.getData("listId") !== ""
}

function handleNewList() {
    const name = prompt("New list name?")
    if (name == null || name === "") {
        return
    }

    // Move other lists down one in the pecking order
    backendStore.lists.forEach(list => {
        if (list.order >= props.order) {
            patchList(list, { order: list.order + 1 })
        }
    })

    const newListId = backendStore.addList({
        name,
        order: props.index,
        taskIds: [],
    })
}
</script>

<template>
    <div :class="`${state.isListBeingDraggedOver ? 'bg-amber-400' : 'bg-gray-50'}`">
        <button @click.prevent="handleNewList()"><i class="pi pi-plus-circle"></i></button>
    </div>
</template>