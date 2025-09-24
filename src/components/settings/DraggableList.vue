<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../../services/backendStore';
import ListDropZone from './ListDropZone.vue';
import { useToast } from 'vue-toastification';
import { enableDragDropTouch } from '@dragdroptouch/drag-drop-touch'

enableDragDropTouch()

const backendStore = useBackendStore()

const toast = useToast()

const props = defineProps({
    listId: {
        type: String,
        required: true,
    },
    index: {
        type: Number,
        required: true,
    },
})
const state = reactive({
    isLoaded: false,
    list: null,
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.list = backendStore.getList(props.listId)
        state.isLoaded = true
    }
})

function startDrag(evt) {
    console.log("Starting to drag", evt)
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('listId', state.list.id)
}

async function handleDelete() {
    if (state.list.taskIds.length === 0 && !state.list.isSpecial) {
        if (!confirm(`Are you sure you want to delete empty list '${state.list.name}' (id ${state.list.id})?`)) {
            return
        }

        await backendStore.deleteList(state.list)
        toast.success(`Successfully deleted list '${state.list.name}'`)
    }
}

</script>

<template>
    <ListDropZone v-if="props.index === 0" :index="0" />

    <div class="bg-gray-400 rounded-xl w-40 p-4 text-center cursor-move" draggable="true"
        @dragstart="startDrag($event)">
        <h2 class="list text-white text-sm mb-4">{{ state.list.name }}</h2>
        <button v-if="state.list.taskIds.length === 0 && !state.list.isSpecial" @click.prevent="handleDelete()"><i
                class="pi pi-trash"></i></button>
    </div>

    <ListDropZone :index="props.index + 1" />
</template>