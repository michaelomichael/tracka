import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TaskListsView from '../views/TaskListsView.vue'
import TaskEditView from '../views/TaskEditView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'task-lists',
      component: TaskListsView,
    },
    {
      path: '/tasks/:id/edit',
      name: 'edit-task',
      component: TaskEditView,
    },
    // {
    //   path: '/tasks/{id}',
    //   name: 'task',
    //   component: TaskView,
    // },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
