<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../../services/backendStore';
import Loading from '../widgets/Loading.vue';
import { formatDateForFilename } from "../../services/utils";
import { useLogger } from "../../services/logger";

const { log } = useLogger()
const backendStore = useBackendStore()

const state = reactive({
    isLoaded: false,
    selectedBackupFile: null,
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.isLoaded = true
    }
})

function downloadBackup() {
    log("Preparing backup file")
    const json = backendStore.createBackupJson()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const filename = `Tracka backup ${formatDateForFilename()}.json`
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click();

    URL.revokeObjectURL(url);

    log("Backup download complete")
}
</script>

<template>
    <div>
        <Button v-if="state.isLoaded" @click.prevent="downloadBackup"> Backup </Button>
        <Loading v-else />
    </div>
</template>