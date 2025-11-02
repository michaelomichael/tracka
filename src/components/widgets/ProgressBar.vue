<script setup>

defineProps({
    progress: {
        type: Number,
        required: true
    }
})
</script>

<template>
    <div class="w-full h-2 border-1 border-gray-400 rounded-sm">
        <div class="bg-green-800 h-full" :style="`width: ${progress * 100}%`"></div>
    </div>
</template>