import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import 'vue-toastification/dist/index.css'
import Toast from 'vue-toastification'
import { createPinia } from 'pinia'
import { Modal } from '@kouts/vue-modal'

const app = createApp(App)

app.use(router)
app.use(Toast)
app.use(createPinia())
app.component('Modal', Modal)
app.mount('#app')
