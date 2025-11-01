import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import 'vue-toastification/dist/index.css'
import Toast, { TYPE } from 'vue-toastification'
import { createPinia } from 'pinia'
import { Modal } from '@kouts/vue-modal'

const app = createApp(App)

app.use(router)
app.use(Toast, {
  toastDefaults: {
    [TYPE.ERROR]: {
      timeout: 10000,
      closeButton: 'button',
      hideProgressBar: true,
    },
    [TYPE.WARNING]: {
      timeout: 4000,
      closeButton: 'button',
      hideProgressBar: true,
    },
    [TYPE.SUCCESS]: {
      timeout: 3000,
      hideProgressBar: true,
    },
  },
})
app.use(createPinia())
app.component('Modal', Modal)
app.mount('#app')
