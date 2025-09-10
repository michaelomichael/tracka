<script setup>
import { useRoute } from "vue-router";
import TaskEdit from "../components/TaskEdit.vue";

const route = useRoute()
const taskId = route.params.id;
</script>

<template>
    <TaskEdit :taskId="taskId" />
</template>