import { createRouter, createWebHistory } from 'vue-router'
import TaskListsView from '../views/TaskListsView.vue'
import SearchTasksView from '../views/SearchTasksView.vue'
import SettingsView from '../views/SettingsView.vue'

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
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
})

export default router
