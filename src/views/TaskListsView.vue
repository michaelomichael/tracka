<script setup>
import { useBackendStore } from "../services/backendStore";
import TaskList from "../components/TaskList.vue";
import { storeToRefs } from "pinia";
import { list } from "firebase/storage";
import { onBeforeUpdate, reactive } from "vue";

const backendStore = useBackendStore();
const { listsById } = storeToRefs(backendStore)

console.log("TaskListsView: listsByIdRef.value is ", JSON.stringify(listsById.value), JSON.stringify(Object.values(listsById.value)))
const state = reactive({
    lists: Object.values(listsById.value), // TODO: Is it ok to do this?
})

onBeforeUpdate(() => {
    console.log("TaskListsView: onBeforeUpdate, listsByIdRef.value is ", JSON.stringify(listsById.value), JSON.stringify(Object.values(listsById.value)))
    console.log("TaskListsView: onBeforeUpdate, state.lists was ", JSON.stringify(state.lists))
    state.lists = Object.values(listsById.value)
    console.log("TaskListsView: onBeforeUpdate, state.lists is now ", JSON.stringify(state.lists))
});
</script>

<template>
    <div class="flex w-full h-full">
        <main class="flex-1 overflow-x-auto p-6 bg-white">
            <h2>Lists galore!</h2>

            <section v-if="listsById.value || state.lists">
                <div class="flex ">

                    <!-- <pre>Hello: {{ JSON.stringify(state.lists) }} {{ JSON.stringify(listsById.value) }}</pre> -->
                    <TaskList v-for="list in state.lists" :key="list.id" :listId="list.id" />
                </div>
            </section>
        </main>
        <section id="sidePanel" class="min-h-screen w-64 bg-gray-100 border-r border-gray-300 border-l-1 p-6">
            Side panel
        </section>
    </div>
</template>