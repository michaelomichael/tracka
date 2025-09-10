import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore'
import credentials from '@/../firebaseCredentials.json'
import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import { single } from './utils'

const defaultData = {
  lists: {
    1: {
      id: '1',
      name: 'Done',
      specialCategory: 'DONE',
      taskIds: ['1000'],
    },
    2: {
      id: '2',
      name: 'Backlog',
      specialCategory: 'NEW_ITEMS',
      taskIds: ['2000', '3000'],
    },
    3: {
      id: '3',
      name: 'Today',
      taskIds: [],
    },
  },
  tasks: {
    1000: {
      id: '1000',
      title: 'Default task #1',
      description: 'Description of default task #1',
      listId: '1',
      parentTaskId: null,
      childTaskIds: [],
    },
    2000: {
      id: '2000',
      title: 'Default task #2',
      description: 'Description of default task #2',
      listId: '2',
      parentTaskId: null,
      childTaskIds: ['3000'],
    },
    3000: {
      id: '3000',
      title: 'Default task #3',
      description: 'Description of default task #3',
      listId: '2',
      parentTaskId: '2000',
      childTaskIds: [],
    },
  },
}

function addLotsOfTasks() {
  const ids = new Array(25).fill('').map((_, index) => {
    const id = `${5000 + index}`
    setDoc(doc(db, 'tasks', id), {
      id: id,
      title: `Extra task #${index + 1}`,
      description: `Description of extra task #${index + 1}`,
      listId: '3',
      parentTaskId: null,
      childTaskIds: [],
    })
    return id
  })

  setDoc(doc(db, 'lists', '3'), {
    id: '3',
    name: 'Today',
    taskIds: ids,
  })
}

async function repopulateCollection(collectionType) {
  const snapshot = await getDocs(collection(db, collectionType))
  const deletions = snapshot.docs.map((d) => deleteDoc(doc(db, collectionType, d.id)))
  await Promise.all(deletions)

  const writes = Object.values(defaultData[collectionType]).map((item) =>
    setDoc(doc(db, collectionType, item.id), item),
  )
  await Promise.all(writes)
}

export async function resetDb() {
  repopulateCollection('tasks')
  repopulateCollection('lists')
}

//await resetDb()

// TODO: Is this not done in the main app script?
export const firebaseApp = initializeApp(credentials)

const db = getFirestore(firebaseApp)

export const useBackendStore = defineStore('backendStore', () => {
  const _data = reactive({ listsById: {}, tasksById: {} })
  const lists = computed(() => Object.values(_data.listsById))
  const tasks = computed(() => Object.values(_data.tasksById))
  const doneList = computed(() => single(lists, (list) => list.specialCategory === 'DONE'))
  const newItemsList = computed(() => single(lists, (list) => list.specialCategory === 'NEW_ITEMS'))
  const _status = reactive({
    lists: {
      unsubscribeCallback: null,
      isLoaded: false,
    },
    tasks: {
      unsubscribeCallback: null,
      isLoaded: false,
    },
  })
  const isLoaded = computed(() => _status.lists.isLoaded && _status.tasks.isLoaded)

  // Sync Firestore -> Pinia
  const init = () => {
    for (let collectionType of ['lists', 'tasks']) {
      const entityStatus = _status[collectionType]

      if (entityStatus.unsubscribeCallback === null) {
        // avoid duplicate listeners
        entityStatus.unsubscribeCallback = onSnapshot(
          collection(db, collectionType),
          (snapshot) => {
            console.log('Snapshot')
            handleDocChanges(snapshot, collectionType, _data[`${collectionType}ById`])
            entityStatus.isLoaded = true
          },
        )
      }
    }
  }

  function _ensureLoaded() {
    if (!isLoaded) {
      throw 'backendStore: attempted to access tasks or lists before data was loaded'
    }
  }

  function getTask(taskId) {
    _ensureLoaded()
    const task = _data.tasksById[taskId]
    if (task === null) {
      console.warn(`backendStore.getTask: Task id '${taskId}' was not found`)
    }
    return task
  }

  function getList(listId) {
    _ensureLoaded()
    const list = _data.listsById[listId]
    if (list === null) {
      console.warn(`backendStore.getList: List id '${listId}' was not found`)
    }
    return list
  }

  function getListForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject) : taskIdOrObject
    if (task === null) {
      throw 'backendStore.getListForTask: Task was null'
    }

    if (task.listId === null) {
      throw `backendStore.getListForTask: Task id ${task.id} has no listId`
    }

    return getList(task.listId)
  }

  function getParentAndChildTasksForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject) : taskIdOrObject
    return {
      parentTask: getParentTaskForTask(task),
      childTasks: getChildTasksForTask(task),
    }
  }

  function getChildTasksForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject) : taskIdOrObject

    return task === null
      ? null
      : (task.childTaskIds || [])
          ?.map((childTaskId) => getTask(childTaskId))
          ?.filter((childTask) => childTask !== null)
  }

  function getParentTaskForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject) : taskIdOrObject
    return task?.parentTaskId == null ? null : getTask(task.parentTaskId)
  }

  function updateList(newList) {
    updateDoc(doc(db, 'lists', newList.id), newList)
  }

  function updateTask(newTask) {
    const taskId = newTask.id
    const oldTask = getTask(taskId)

    if (oldTask !== null) {
      // Check to see if its list has changed
      //   if (oldTask.listId !== newTask.listId) {
      //     console.log(
      //       `BackendStore.updateTask: Changing list from ${oldTask.listId} to ${newTask.listId}`,
      //     )
      //     const newList = listsById.value[newTask.listId]
      //     if (newList !== null) {
      //       console.log('Before, newList had ', JSON.stringify(newList.taskIds))
      //       newList.taskIds.unshift(taskId)
      //       // TODO: Update the value in firestore, preferably in a transaction
      //       console.log('After, newList has', JSON.stringify(newList.taskIds))
      //       const oldList = listsById.value[oldTask.listId]
      //       if (oldList !== null) {
      //         console.log('Before, oldList had ', JSON.stringify(oldList.taskIds))
      //         oldList.taskIds = oldList.taskIds.filter((otherTaskId) => otherTaskId !== taskId)
      //         // TODO: Update the value in firestore, preferably in a transaction
      //         console.log('After, oldList has ', JSON.stringify(oldList.taskIds))
      //       } else {
      //         console.warn(
      //           `BackendStore.updateTask: Couldn't find old list with id ${oldTask.listId} for task id ${taskId}`,
      //         )
      //       }
      //     } else {
      //       throw `Couldn't find new list with id ${newTask.listId} for task id ${taskId}`
      //     }
      //   }
      //   // Check to see if parent has changed
      //   if (oldTask.parentTaskId !== newTask.parentTaskId) {
      //     console.log(
      //       `BackendStore.updateTask: Changing parent task Id from ${oldTask.parentTaskId} to ${newTask.parentTaskId}`,
      //     )
      //     const oldParentTask = tasksById.value[oldTask.parentTaskId]
      //     oldParentTask.childTaskIds = oldParentTask.childTaskIds.filter(
      //       (otherTaskId) => otherTaskId !== taskId,
      //     )
      //     // TODO: Update the value in firestore, preferably in a transaction
      //     const newParentTask = tasksById.value[newTask.parentTaskId]
      //     newParentTask.childTaskIds.unshift(taskId)
      //     // TODO: Update the value in firestore, preferably in a transaction
      //   }
      // TODO: check to see if children have changed (not supported by UI yet)
    } else {
      console.warn("BackendStore.updateTask: Didn't find an existing task for", taskId, newTask)
    }

    // tasksById.value[newTask.id] = newTask
    updateDoc(doc(db, 'tasks', taskId), newTask)
  }

  return {
    _data,
    _status,
    init,
    isLoaded,
    tasks,
    lists,
    getTask,
    getList,
    getListForTask,
    getParentAndChildTasksForTask,
    getChildTasksForTask,
    getParentTaskForTask,
    updateList,
    updateTask,
  }
})

function handleDocChanges(snapshot, collectionType, containerObject) {
  snapshot.docChanges().forEach((change) => {
    const itemData = { id: change.doc.id, ...change.doc.data() }

    switch (change.type) {
      case 'added':
        console.log(
          `BackendStore.handleDocChange: DB reports ADD in ${collectionType}: id=${itemData.id}`,
        )
        containerObject[itemData.id] = itemData
        break

      case 'modified':
        console.log(
          `BackendStore.handleDocChange: DB reports UPDATE in ${collectionType}: id=${itemData.id}`,
        )
        containerObject[itemData.id] = itemData
        // We shouldn't need to worry about updating child and parent IDs - they should also be saved in the DB.
        break

      case 'removed':
        console.log(
          `BackendStore.handleDocChange: DB reports DELETE in ${collectionType}: id=${itemData.id}`,
        )
        delete containerObject[itemData.id]
        break

      default:
        console.warn(
          `backendStore.handleDocChange: Unknown change type '${change.type}' for ${collectionType} id=${itemData.id}`,
        )
        break
    }
  })
}
