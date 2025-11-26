<script setup>

defineProps({
    progress: {
        type: Number,
        required: true
    },
    progress2: {
        type: Number,
        required: false,
        default: null,
    }
})
</script>

<template>
    <div class="w-full h-2 border-1 border-gray-400 rounded-sm relative">

        <div class="bg-yellow-500 h-full absolute top-0 left-0" :style="`width: ${progress2 * 100}%`"
            v-if="progress2 != null"></div>
        <div class="bg-green-800 h-full absolute top-0 left-0" :style="`width: ${progress * 100}%`"></div>
    </div>
</template>