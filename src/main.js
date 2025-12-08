import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import 'vue-toastification/dist/index.css'
import Toast, { TYPE, useToast } from 'vue-toastification'
import { createPinia } from 'pinia'
import { Modal } from '@kouts/vue-modal'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import Button from 'primevue/button'
import { DatePicker } from 'primevue'

const app = createApp(App)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})
app.use(router)
app.use(Toast, {
  shareAppContext: true, // Enables it to find 'router' when passing custom Components as the toast text
  toastDefaults: {
    [TYPE.ERROR]: {
      timeout: 10000,
      closeButton: 'button',
      hideProgressBar: true,
      position: 'bottom-right',
    },
    [TYPE.WARNING]: {
      timeout: 4000,
      closeButton: 'button',
      hideProgressBar: true,
      position: 'bottom-right',
    },
    [TYPE.SUCCESS]: {
      timeout: 30000,
      hideProgressBar: true,
      position: 'bottom-right',
    },
  },
})
app.use(createPinia())
app.component('Modal', Modal)
app.component('Button', Button)
app.component('DatePicker', DatePicker)

app.config.errorHandler = (err, instance, info) => {
  console.error('Global Vue error:', err, instance, info)

  try {
    const toast = useToast()
    toast.error(`Error: ${err}\nSee console for more details`)
  } catch (e) {
    console.error('...and I failed to show an error toast', e)
    alert('Error occurred. See the console for more details.')
  }
}

app.mount('#app')
