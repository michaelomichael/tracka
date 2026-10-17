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

  const _isValid = (newFields) =>
    newFields != null &&
    typeof newFields === 'object' &&
    typeof newFields.title === 'string' &&
    newFields.title != null &&
    newFields.title.trim() !== ''

  const pushTask = async (newFields) => {
    if (!_isValid(newFields)) {
      try {
        const json = JSON.stringify(newFields)
        throw new Error('New fields provided to LocalStore.pushTask() is invalid: ' + json)
      } catch (e) {
        throw new Error('New fields provided to LocalStore.pushTask() is invalid')
      }
    }
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
