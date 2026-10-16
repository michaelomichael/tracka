import { createRouter, createWebHistory } from 'vue-router'
import TaskListsView from '../views/TaskListsView.vue'
import SearchTasksView from '../views/SearchTasksView.vue'
import SettingsView from '../views/SettingsView.vue'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import SignupView from '../views/SignupView.vue'
import UserProfileView from '../views/UserProfileView.vue'
import SigninView from '../views/SigninView.vue'
import { useToast } from 'vue-toastification'
import { getCurrentUserOnceFirebaseHasLoaded } from '../services/utils'
import ArchivedTasksView from '../views/ArchivedTasksView.vue'
import QuickCreateTaskView from '../views/QuickCreateTaskView.vue'
import Error404View from '../views/Error404View.vue'
import { useLogger } from '../services/logger.js'

const { log } = useLogger()
const toast = useToast()

// TODO: Why is this in the router and not main.js?
if (Capacitor.isNativePlatform()) {
  await StatusBar.setOverlaysWebView({ overlay: false })
  StatusBar.setBackgroundColor({ color: '#000000' })
  StatusBar.setStyle({ style: Style.Dark })
  await StatusBar.show()
}

log('In index.js, creating router')
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TaskListsView,
    },
    {
      path: '/tasks',
      name: 'tasks',
      redirect: '/',
    },
    {
      path: '/lists/:listId/edit',
      name: 'edit-list',
      component: TaskListsView,
    },
    {
      path: '/tasks/:taskId/edit',
      name: 'edit-task',
      component: TaskListsView,
    },
    {
      path: '/tasks/new',
      name: 'new-task',
      component: TaskListsView,
    },
    {
      path: '/tasks/search',
      name: 'search-for-tasks',
      component: SearchTasksView,
    },
    {
      path: '/tasks/archive',
      name: 'archived-tasks',
      component: ArchivedTasksView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/auth/signup',
      name: 'signup',
      meta: {
        allowUnauthorised: true,
      },
      component: SignupView,
    },
    {
      path: '/auth/signin',
      name: 'signin',
      meta: {
        allowUnauthorised: true,
      },
      component: SigninView,
    },
    {
      path: '/auth/profile',
      name: 'user-profile',
      component: UserProfileView,
    },
    {
      path: '/quickTask',
      name: 'quick-create-task',
      meta: {
        allowUnauthorised: true,
      },
      component: QuickCreateTaskView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      component: Error404View,
    },
  ],
})

async function handleOpenUrl(url) {
  log('In handleOpenUrl(), url is', url, 'and route is', router.currentRoute.value.fullPath)

  if (url.includes('/link/quickTask')) {
    log('Routing to /quickTask')
    await router.replace('/quickTask')
  } else if (url.includes('/link/board')) {
    log('Routing to /')
    await router.push('/')
  }

  log('In handleOpenUrl(), after possible push, route is', router.currentRoute.value.fullPath)
}

const launchUrl = await CapacitorApp.getLaunchUrl()
log('Result of getLaunchUrl is', JSON.stringify(launchUrl))
if (launchUrl?.url) {
  handleOpenUrl(launchUrl.url)
}

CapacitorApp.addListener('appUrlOpen', (event) => {
  log('In CapacitorApp.addListener(), event is ', JSON.stringify(event))
  handleOpenUrl(event.url)
})

// Only now that the correct starting route has been selected do we add the router.beforeEach() guard
router.beforeEach(async (to, from, next) => {
  log('In router.beforeEach, to is', JSON.stringify(to), 'from is', JSON.stringify(from))
  if (to.matched.some((record) => record.meta.allowUnauthorised)) {
    next()
  } else if (await getCurrentUserOnceFirebaseHasLoaded()) {
    next()
  } else {
    toast.warning('You must be logged in to continue')
    next('/auth/signin')
  }
})

export default router
