import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import 'vue-toastification/dist/index.css'
import Toast, { TYPE } from 'vue-toastification'
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
      timeout: 3000,
      hideProgressBar: true,
      position: 'bottom-right',
    },
  },
})
app.use(createPinia())
app.component('Modal', Modal)
app.component('Button', Button)
app.component('DatePicker', DatePicker)
app.mount('#app')
