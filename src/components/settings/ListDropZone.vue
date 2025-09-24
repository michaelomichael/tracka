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

function handleDragEnter(evt) {
    state.isListBeingDraggedOver = true
}

function handleDragOver(evt) {
    state.isListBeingDraggedOver = true
}

function handleDragLeave(evt) {
    state.isListBeingDraggedOver = false
}

function handleDrop(evt) {
    console.log("ListDropZone.handleDrop")
    const listId = evt.dataTransfer.getData('listId')
    if (isListDraggingEvent(evt)) {
        console.log("ListDropZone.handleDrop: List ID", listId, evt)
        state.isListBeingDraggedOver = false

        const draggedList = backendStore.getList(listId)
        const draggedListOriginalIndex = draggedList.order
        const allLists = backendStore.lists

        // The rules around how to adjust the lists' `order`s are a little confusing.
        // - If the list has been dragged to the left of its current position then:
        //      (The index of the drop zone will be <= the list's current `order` value.)
        //      The index of the drop zone it lands on is the value that we want to
        //          use for the list's `order`.
        //      Want to move all lists positioned from the list's new location (inclusive)
        //          to the list's old location (exclusive) one space to the right.
        // - If the list has been dragged to the right of its current position then:
        //      (The index of the drop zone will be > the list's current `order` value.)
        //      The index of the drop zone *minus 1* is the value that we want to use
        //          for the list's `order`.
        //      Want to move all lists positioned from  the list's old location (exclusive)
        //          to the list's new position (inclusive) one space to the left.
        let draggedListNewIndex
        if (props.index <= draggedListOriginalIndex) {
            // Dragging to the left
            draggedListNewIndex = Math.max(0, props.index)
        } else {
            // Dragging to the right
            draggedListNewIndex = Math.min(props.index - 1, allLists.length - 1)
        }

        // Do the order tweaking with an actual array of List objects, just in case
        // any lists currently have duplicate order values for some reason.
        allLists
            .filter(list => list.id !== listId) // Remove the dragged list
            .toSpliced(draggedListNewIndex, 0, draggedList) // And add it back in again in the new location
            .forEach((list, index) => {
                if (list.order !== index) {
                    console.log(`Changing index of '${list.id}' from ${list.order} to ${index}`)
                    backendStore.patchList(list, { order: index })
                }
            })
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
    <div @dragover.prevent="handleDragOver($event)" @dragenter.prevent="handleDragEnter($event)"
        @dragleave.prevent="handleDragLeave($event)" @drop="handleDrop($event)"
        :class="`${state.isListBeingDraggedOver ? 'bg-amber-400' : 'bg-gray-450'} w-10 flex justify-center items-center px-2`">
        <button @click.prevent="handleNewList()"><i class="pi pi-plus-circle"></i></button>
    </div>
</template>