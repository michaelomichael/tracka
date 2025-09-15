<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../../services/backendStore';
import { useToast } from 'vue-toastification';
import { list } from 'firebase/storage';
import DraggableList from './DraggableList.vue';

const backendStore = useBackendStore()

const toast = useToast()

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

function handleSubmit() {

}

</script>

<template>
    <section v-if="state.isLoaded">
        <h2> Lists</h2>
        <div class="flex gap-2 items-stretch">
            <DraggableList v-for="(list, index) in state.lists" :key="list.id" :listId="list.id" :index="index" />
        </div>
    </section>
</template>