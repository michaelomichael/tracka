<script setup>
import { reactive, watchEffect } from 'vue';
import { useBackendStore } from '../../services/backendStore';
import Loading from '../widgets/Loading.vue';
import { useLogger } from "../../services/logger";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";
import { FileUpload } from "primevue";

const { log, error } = useLogger()
const backendStore = useBackendStore()
const toast = useToast()
const router = useRouter()

const state = reactive({
    isLoaded: false,
    selectedFile: null,
})

watchEffect(() => {
    if (backendStore.isLoaded) {
        state.isLoaded = true
    }
})

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
    <div>
        <div v-if="state.isLoaded">
            <div v-if="!state.selectedFile">
                <FileUpload choose-label="Select a backup file to restore" mode="basic" @select="handleFileSelected"
                    customUpload auto severity="secondary" class="p-button-outlined" />
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

        <Loading v-else />
    </div>
</template>