<script setup>
import { reactive, watchEffect } from 'vue';
import { useToast } from "vue-toastification";
import { useBackendStore } from "../services/backendStore";
import { useLogger } from "../services/logger";
import InlineHtml from "../components/widgets/InlineHtml.vue";

const { log } = useLogger()
const backendStore = useBackendStore()
const toast = useToast();

const form = reactive({
    title: "",
    description: "",
    isDueByEnabled: false,
    dueByDate: null,
});

const state = reactive({
})

watchEffect(() => {

    state.isLoaded = true
})

const resetForm = () => {
    form.title = ""
    form.description = ""
    form.isDueByEnabled = false
    form.dueByDate = null
}

const handleSubmit = async () => {
    log("Submitting")

    const dueByDate = typeof (form.dueByDate) === "string"
        ? form.dueByDate
        : form.dueByDate?.toISOString()?.substring(0, 10)

    if (backendStore.isLoaded) {
        const newTask = await backendStore.addTask({
            title: form.title,
            description: form.description,
            listId: backendStore.newItemsList.id,
            dueByTimestamp: form.isDueByEnabled ? `${dueByDate}T08:00:00Z` : null,
        })

        toast.success({
            component: InlineHtml,
            props: {
                elements: [
                    "Created task ",
                    { type: "a", href: `/tasks/${newTask.id}/edit`, text: newTask.title },
                ]
            },

        }, {
            timeout: 5000,
        })
        resetForm()
    } else {
        alert("TODO: Handle when backend store is not yet loaded")
    }
}

</script>

<template>
    <main class="m-4">
        <section class="w-60 m-auto">
            <h2 class="m-3 text-center">
                Quick Create Task
            </h2>
            <form v-if="state.isLoaded" @submit.prevent="handleSubmit()">

                <div id="title-field" class="mb-4">
                    <input v-model="form.title" type="text" id="title" name="title" placeholder="Task title"
                        class="border rounded w-full p-2 mb-2" required autofocus />
                </div>

                <div id="description-field" class="mb-4">
                    <textarea v-model="form.description" id="description" name="description" placeholder="Description"
                        class="border rounded w-full p-2" rows="4"></textarea>
                </div>

                <div id="due-date-field" class="mb-4 flex gap-2 items-baseline">
                    <input type="checkbox" id="due-date-enabled" v-model="form.isDueByEnabled" />
                    <label for="due-date-enabled">Due date{{ form.isDueByEnabled ? ':' : '' }} </label>
                    <DatePicker v-if="form.isDueByEnabled" v-model="form.dueByDate" fluid date-format="yy-mm-dd" />
                </div>

                <div id="buttons" class="flex justify-center items-baseline">
                    <Button type="submit">Save</Button>
                    <RouterLink to="/" class="mx-4">Cancel</RouterLink>
                </div>
            </form>
        </section>
    </main>
</template>