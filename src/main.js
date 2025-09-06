import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import 'vue-toastification/dist/index.css'
import Toast from 'vue-toastification'
import { createPinia } from 'pinia'

const app = createApp(App)

app.use(router)
app.use(Toast)
app.use(createPinia())
app.mount('#app')
