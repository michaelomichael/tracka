<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../services/backendStore';
import ListsEditor from '../components/settings/ListsEditor.vue';
import Loading from '../components/widgets/Loading.vue';
import { formatDateForFilename } from "../services/utils";
import { useLogger } from "../services/logger";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";
import { FileUpload } from "primevue";

const { log, error } = useLogger()
const backendStore = useBackendStore()
const toast = useToast()
const router = useRouter()

const state = reactive({
    isLoaded: false,
    lists: null,
    selectedBackupFile: null,
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.lists = backendStore.lists
        state.isLoaded = true
    }
})

async function archiveOldTasks() {
    await backendStore.archiveDoneTasks()
}

function downloadBackup() {
    const json = backendStore.createBackupJson()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const filename = `Tracka backup ${formatDateForFilename()}.json`
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click();

    URL.revokeObjectURL(url);

    toast.success(`Backup completed: ${filename}`)
}

function handleFileSelected(event) {
    state.selectedFile = event.files[0]
}

function handleCancelRestore() {
    state.selectedFile = null
}

async function handleRestoreFromSelectedFile() {
    if (!state.selectedFile) return

    log("upload: file is", state.selectedFile)
    const text = await state.selectedFile.text()

    try {
        await backendStore.restoreFromBackupJson(text)
        state.selectedFile = null
        log("Restore completed")
        toast.success("Restore complete!")
        router.push("/")
    } catch (e) {
        error("Restore failed", e)
        toast.error(`Restore failed: ${e}`)
    }
}
</script>

<template>
    <main class="m-4">
        <h1> Settings </h1>

        <div v-if="state.isLoaded">
            <section>
                <h2> Lists</h2>
                <ListsEditor />
            </section>
            <section class="mt-4">
                <h2>Housekeeping</h2>
                <div class="housekeeping-section">
                    <h3> Archiving </h3>
                    <Button @click.prevent="archiveOldTasks"> Archive Old Tasks </Button>
                </div>
                <div class="housekeeping-section">
                    <h3> Backup</h3>
                    <Button @click.prevent="downloadBackup"> Backup </Button>
                </div>
                <div class="housekeeping-section">
                    <h3> Restore</h3>
                    <div v-if="!state.selectedFile">
                        <FileUpload choose-label="Select a backup file to restore" mode="basic"
                            @select="handleFileSelected" customUpload auto severity="secondary"
                            class="p-button-outlined" />
                    </div>
                    <div v-else>
                        <div class="flex gap-2 items-baseline mb-4">
                            <label class="font-semibold">Selected file:</label>
                            <span>{{ state.selectedFile.name }}</span>
                        </div>
                        <div class="flex gap-2 items-baseline">
                            <Button severity="danger" @click.prevent="handleRestoreFromSelectedFile"> Restore from this
                                file </Button>
                            <Button severity="secondary" @click.prevent="handleCancelRestore">Cancel</Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <Loading v-else />
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