<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../../services/backendStore';
import { useToast } from 'vue-toastification';

const backendStore = useBackendStore()
const toast = useToast()

const props = defineProps({
    listId: {
        type: String,
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

async function handleDeleteList() {
    if (state.list.taskIds.length === 0 && !state.list.specialCategory) {
        if (!confirm(`Are you sure you want to delete empty list '${state.list.name}' (id ${state.list.id})?`)) {
            return
        }

        await backendStore.deleteList(state.list)
        toast.success(`Successfully deleted list '${state.list.name}'`)
    }
}

async function handleRenameList() {
    const name = prompt("List name:", state.list.name)
    if (name == null || name === "" || name === state.list.name) {
        return
    }

    console.log(`EditableList.handleRenameList: Renaming from '${state.list.name}' to '${name}'`)
    await backendStore.patchList(state.list, { name })
}
</script>

<template>
    <div class="bg-gray-400 rounded-xl p-4 text-center cursor-move ">
        <h2 class="list mb-4">
            <span class="text-white text-lg font-semibold">{{ state.list.name }}</span>
            <button v-if="!state.list.specialCategory" title="Rename list" class="ml-2 text-sm hover:scale-150"
                @click.prevent="handleRenameList">
                <i class="pi pi-pencil"></i>
            </button>
        </h2>

        <div class="text-xs m-2 text-white">
            {{ state.list.taskIds.length === 1 ? " 1 task" : `${state.list.taskIds.length} tasks` }}
        </div>

        <div class="mt-8 hover:scale-150">
            <button v-if="state.list.specialCategory" title="Special list - cannot be edited or deleted"
                class="cursor-not-allowed! opacity-30" disabled="true">
                <i class="pi pi-lock"></i>
            </button>
            <button v-else-if="state.list.taskIds.length > 0" title=" Cannot delete non-empty list"
                class="cursor-not-allowed! opacity-30" disabled="true">
                <i class="pi pi-trash"></i>
            </button>
            <button v-else title="Delete list" @click.prevent="handleDeleteList">
                <i class="pi pi-trash"></i>
            </button>
        </div>
    </div>
</template>