<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../services/backendStore';
import ListsEditor from '../components/settings/ListsEditor.vue';
import Loading from '../components/widgets/Loading.vue';
import { formatDateForFilename } from "../services/utils";
import { useLogger } from "../services/logger";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";

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

function createBackup() {
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
    state.selectedFile = event.target.files[0]
}

async function handleRestoreFromSelectedFile() {
    if (!state.selectedFile) return

    log("upload: file is", state.selectedFile)
    const text = await state.selectedFile.text()

    try {
        await backendStore.restoreFromBackupJson(text)
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
                <div class="mt-4">
                    <h3> Archiving </h3>
                    <Button @click.prevent="archiveOldTasks"> Archive Old Tasks </Button>
                </div>
                <div class="mt-4">
                    <h3> Backup</h3>
                    <Button @click.prevent="createBackup"> Backup </Button>
                </div>
                <div class="mt-4">
                    <h3> Restore</h3>
                    <!-- TODO: Use https://primevue.org/fileupload/ -->
                    <input type="file"
                        className="text-sm text-stone-500 file:mr-5 file:py-1 file:px-3 file:border-[1px] file:text-xs file:font-medium file:bg-stone-50 file:text-stone-700 hover:file:cursor-pointer hover:file:bg-blue-50 hover:file:text-blue-700"
                        @change="handleFileSelected" />
                    <Button @click.prevent="handleRestoreFromSelectedFile" :disabled="!state.selectedFile"> Restore from
                        Backup
                    </Button>
                </div>
            </section>
        </div>

        <Loading v-else />
    </main>
</template>