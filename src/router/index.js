import { createRouter, createWebHistory } from 'vue-router'
import TaskListsView from '../views/TaskListsView.vue'
import SearchTasksView from '../views/SearchTasksView.vue'
import SettingsView from '../views/SettingsView.vue'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import SignupView from '../views/SignupView.vue'
import UserProfileView from '../views/UserProfileView.vue'
import SigninView from '../views/SigninView.vue'
import { useToast } from 'vue-toastification'
import { getCurrentUserOnceFirebaseHasLoaded } from '../services/utils'
import ArchivedTasksView from '../views/ArchivedTasksView.vue'
import QuickCreateTaskView from '../views/QuickCreateTaskView.vue'
import Error404View from '../views/Error404View.vue'

const toast = useToast()

if (Capacitor.isNativePlatform()) {
  await StatusBar.setOverlaysWebView({ overlay: false })
  StatusBar.setBackgroundColor({ color: '#000000' })
  StatusBar.setStyle({ style: Style.Dark })
  await StatusBar.show()
}

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
      component: QuickCreateTaskView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      component: Error404View,
    },
  ],
})

router.beforeEach(async (to, from, next) => {
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
