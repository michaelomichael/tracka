<script setup>
import { reactive, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter()
const route = useRoute()
const state = reactive({
    searchString: route.query.search ?? "",
    isSearchActive: false,
})

watchEffect(() => {
    const urlSearchString = route.query.search ?? ""
    console.log("UrlSearchString is ", urlSearchString)
    const formSearchString = state.searchString.trim()
    state.isSearchActive = urlSearchString.length > 0
})

function handleSubmit() {
    console.log("Submitted", state.searchString)
    const submittedSearchString = state.searchString.trim()
    if (submittedSearchString.length > 0) {
        router.push({
            query: {
                search: submittedSearchString,
            },
        })
    } else {
        router.push({
            query: {

            },
        })
    }
}
</script>


<template>
    <form @submit.prevent="handleSubmit()">
        <input :class="`px-2 text-sm ${state.isSearchActive ? 'bg-amber-400' : 'bg-white '}`"
            v-model="state.searchString" type="text" placeholder="Search" />
    </form>
</template>