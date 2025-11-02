<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../../services/backendStore';
import ListEdit from './ListEdit.vue';
import draggable from "vuedraggable";
import { useLogger } from '../../services/logger';

const { log } = useLogger()
const backendStore = useBackendStore()

const state = reactive({
    isLoaded: false,
    sortableListIds: [],
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.sortableListIds = backendStore.lists.map(list => list.id)
        state.isLoaded = true
    }
})

async function handleOrderChanged() {
    log("New order is: ", JSON.stringify(state.sortableListIds))

    state.sortableListIds.forEach((id, index) => {
        const list = backendStore.getList(id)
        if (list.order !== index) {
            log(`  - moving list '${id}' from pos ${list.order} to ${index}`)
            backendStore.patchList(list, { order: index })
        }
    })
}

async function handleNewList() {
    const name = prompt("New list name?")
    if (name == null || name === "") {
        return
    }

    await backendStore.addList({
        name,
        order: backendStore.lists.length, // order is zero-indexed
        taskIds: [],
    })
}
</script>

<template>
    <section v-if="state.isLoaded">
        <draggable class="flex gap-2 items-stretch" v-model="state.sortableListIds" itemKey="this"
            @update="handleOrderChanged" animation="200" delay="1000" delayOnTouchOnly="true">
            <template #item="{ element }">
                <ListEdit :listId="element" class="min-w-40 w-40 snap-center" />
            </template>

            <template #footer>
                <button class="standard-button block rounded-xl! min-w-40 w-40" @click.prevent="handleNewList">
                    <i class="pi pi-plus-circle"> </i> Add a new list</button>
            </template>
        </draggable>

    </section>
</template>