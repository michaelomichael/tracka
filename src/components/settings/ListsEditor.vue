<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../../services/backendStore';
import DraggableList from './DraggableList.vue';

const backendStore = useBackendStore()

const state = reactive({
    isLoaded: false,
    lists: [],
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.lists = backendStore.lists
        state.isLoaded = true
    }
})
</script>

<template>
    <section v-if="state.isLoaded">
        <h2> Lists</h2>
        <div class="flex items-stretch">
            <DraggableList v-for="(list, index) in state.lists" :key="list.id" :listId="list.id" :index="index" />
        </div>
    </section>
</template>