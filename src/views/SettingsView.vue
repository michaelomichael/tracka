<script setup>
import ListsEditor from '../components/settings/ListsEditor.vue';
import DataBackup from "../components/settings/DataBackup.vue";
import DataRestore from "../components/settings/DataRestore.vue";
import DataArchiveDoneTasks from "../components/settings/DataArchiveDoneTasks.vue";

</script>

<template>
    <main class="m-4">
        <h1> Settings </h1>
        <section>
            <h2> List Order</h2>
            <ListsEditor />
        </section>
        <section class="mt-4">
            <h2>Housekeeping</h2>
            <div class="housekeeping-section">
                <h3> Archiving </h3>
                <DataArchiveDoneTasks />
            </div>
            <div class="housekeeping-section">
                <h3> Backup</h3>
                <DataBackup />
            </div>
            <div class="housekeeping-section">
                <h3> Restore</h3>
                <DataRestore />
            </div>
        </section>

    </main>
</template>

<style scoped>
@reference "tailwindcss";

.housekeeping-section {
    @apply mt-4 bg-gray-100 p-4 rounded;
}

.housekeeping-section h3 {
    @apply mb-2;
}
</style>