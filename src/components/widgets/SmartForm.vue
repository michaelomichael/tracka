<script setup>
import { reactive } from "vue"
import { useLogger } from "../../services/logger"
import spinner from '@/assets/spinner-white.svg'

/**
 * A simple wrapper around a form that adds a "submitting" state and shows a spinner while submitting.
 * It also prevents multiple submissions by ignoring submit events while already submitting.
 *
 * Usage:
 * <TForm @submit="handleSubmit">
 *   ... form fields ...
 * </TForm>
 *
 * The handleSubmit function will receive the submit event as an argument.
 */

const state = reactive({
  isSubmitting: false,
})

const emit = defineEmits(['submit'])
const { log } = useLogger()

function handleSubmit(event) {
  if (state.isSubmitting) {
    log("Form is already submitting, ignoring")
    return
  }

  state.isSubmitting = true

  try {
    emit('submit', event)
  } finally {
    state.isSubmitting = false
  }
}
</script>


<template>
  <form @submit.prevent="handleSubmit($event)">
    <fieldset :disabled="state.isSubmitting" :class="['relative', state.isSubmitting ? 'opacity-50' : '']">
      <div
        class="absolute opacity-50 top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none"
        v-if="state.isSubmitting">
        <img :src="spinner" alt="spinner" />
      </div>
      <slot />
    </fieldset>
  </form>
</template>