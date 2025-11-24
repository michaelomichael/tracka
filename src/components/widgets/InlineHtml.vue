<script setup>

/**
 * `elements` should be a mixed array of strings and objects.
 * String items will just be rendered as (escaped) text.
 * Object items should have at least a "type" property. Support object types are:
 *
 *   - type="a" (other properties are "to" and "text")
 *
 * Note: for some reason we don't seem to be able to use RouterLink in here.
 */
const props = defineProps({
    elements: {
        type: Array,
        required: true,
    },
})
</script>

<template>
    <span>
        <span v-for="element in props.elements">
            <span v-if="typeof (element) === 'string'">
                {{ element }}
            </span>
            <a v-else-if="element.type === 'a'" :href="element.href" class="text-link">
                {{ element.text }}
            </a>
            <span v-else class="bg-red-800 text-white p-1">
                ERROR: Unexpected element type '{{ typeof (element) }}' with value '{{ element }}'
            </span>
        </span>
    </span>
</template>