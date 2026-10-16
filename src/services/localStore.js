import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import { useLogger } from './logger'

const LOCAL_STORAGE_KEY = 'temporaryNewTasks'

const { log, info, warn } = useLogger('BackendStore')

export const useLocalStore = defineStore('localStore', () => {
  const numTasks = async () => {
    const tasks = _getExistingTasks()
    return tasks.length
  }

  const popTask = async () => {
    const tasks = _getExistingTasks()
    if (tasks.length === 0) {
      return null
    }

    const task = tasks.pop()
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks))
    return task
  }

  const pushTask = async (newFields) => {
    const tasks = _getExistingTasks()
    tasks.push(newFields)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks))
  }

  const _getExistingTasks = () => {
    const existingTasksJson = localStorage.getItem(LOCAL_STORAGE_KEY)
    return JSON.parse(existingTasksJson) || []
  }

  return {
    _getExistingTasks,
    pushTask,
    popTask,
    numTasks,
  }
})
