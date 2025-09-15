import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore'
import credentials from '@/../firebaseCredentials.json'
import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import { single } from './utils'

const defaultData = {
  lists: {
    DONE: {
      id: 'DONE',
      name: 'Done',
      taskIds: ['1000'],
    },
    BACKLOG: {
      id: 'BACKLOG',
      name: 'Backlog',
      taskIds: ['2000', '3000'],
    },
    TODAY: {
      id: 'TODAY',
      name: 'Today',
      taskIds: [],
    },
  },
  tasks: {
    1000: {
      id: '1000',
      title: 'Default task #1',
      description: 'Description of default task #1',
      listId: 'DONE',
      parentTaskId: null,
      childTaskIds: [],
      isDone: true,
    },
    2000: {
      id: '2000',
      title: 'Default task #2',
      description: 'Description of default task #2',
      listId: 'BACKLOG',
      parentTaskId: null,
      childTaskIds: ['3000'],
      isDone: false,
    },
    3000: {
      id: '3000',
      title: 'Default task #3',
      description: 'Description of default task #3',
      listId: 'BACKLOG',
      parentTaskId: '2000',
      childTaskIds: [],
      isDone: false,
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
      listId: 'BACKLOG',
      parentTaskId: null,
      childTaskIds: [],
      isDone: false,
    })
    return id
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
  const lists = computed(() =>
    Object.values(_data.listsById).toSorted((a, b) => (a.order > b.order ? 1 : -1)),
  )
  const tasks = computed(() => Object.values(_data.tasksById))
  const doneList = computed(() => _data.listsById.DONE)
  const newItemsList = computed(() => _data.listsById.BACKLOG)
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
    if (task == null) {
      console.warn(`backendStore.getTask: Task id '${taskId}' was not found`)
      return null
    }
    return task
  }

  function getList(listId) {
    _ensureLoaded()
    const list = _data.listsById[listId]
    if (list == null) {
      console.warn(`backendStore.getList: List id '${listId}' was not found`)
      return null
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
    return (
      task?.childTaskIds
        ?.map((childTaskId) => getTask(childTaskId))
        ?.filter((childTask) => childTask != null) ?? []
    )
  }

  function getParentTaskForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject) : taskIdOrObject
    return task?.parentTaskId == null ? null : getTask(task.parentTaskId)
  }

  function patchList(listIdOrObject, changes) {
    const newOrOld = (fieldName, changes, oldObject) =>
      changes[fieldName] !== undefined ? changes[fieldName] : oldObject[fieldName]

    _ensureLoaded()
    const originalList =
      typeof listIdOrObject === 'string' ? getList(listIdOrObject) : listIdOrObject

    if (originalList == null) {
      throw ("patchList: can't find original list", listIdOrObject)
    }

    const newList = {
      id: originalList.id,
      name: newOrOld('name', changes, originalList),
      order: newOrOld('order', changes, originalList),
      taskIds: newOrOld('taskIds', changes, originalList),
    }

    updateList(newList)
  }

  function updateList(newList) {
    updateDoc(doc(db, 'lists', newList.id), newList)
  }

  async function addList(newList) {
    // TODO: Figure out what to do when we're offline: it won't create the ID
    const newDocRef = doc(collection(db, 'lists'))
    console.log('backendStore.addList: New document ID is ', newDocRef.id)
    newList.id = newDocRef.id
    await setDoc(newDocRef, newList)
    // const newRef = await addDoc(collection(db, 'lists'), newList)

    newList.taskIds.forEach((taskId) => {
      const task = getTask(taskId)
      patchTask(taskId, { listId: newList.id })
    })

    // TODO: Eventually, sort out mapping for any child tasks too

    return newList.id
  }

  async function deleteList(listIdOrObject) {
    _ensureLoaded()
    const originalList =
      typeof listIdOrObject === 'string' ? getList(listIdOrObject) : listIdOrObject

    if (originalList == null) {
      console.warn(
        'backendStore.deleteList: Attempted to delete list ',
        listIdOrObject,
        'but it was null',
      )
      return
    }

    deleteDoc(doc(db, 'lists', originalList.id))
  }

  async function addTask(newTask) {
    // TODO: Figure out what to do when we're offline: it won't create the ID
    const newDocRef = doc(collection(db, 'tasks'))
    console.log('backendStore.addTask: New document ID is ', newDocRef.id)
    newTask.id = newDocRef.id
    await setDoc(newDocRef, newTask)
    // const newRef = await addDoc(collection(db, 'tasks'), newTask)

    const list = getList(newTask.listId)
    list.taskIds.push(newTask.id)
    updateList(list)

    if (newTask.parentTaskId != null) {
      const parentTask = getParentTaskForTask(newTask)
      if (parentTask != null) {
        parentTask.childTaskIds = (parentTask.childTaskIds ?? []).concat(newTask.id)
        updateTask(parentTask)
      }
    }

    // TODO: Eventually, sort out mapping for any child tasks too

    return newTask.id
  }

  function patchTask(taskIdOrObject, changes) {
    const newOrOld = (fieldName, changes, oldObject) =>
      changes[fieldName] !== undefined ? changes[fieldName] : oldObject[fieldName]

    _ensureLoaded()
    const originalTask =
      typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject) : taskIdOrObject

    if (originalTask == null) {
      throw ("patchList: can't find original task", taskIdOrObject)
    }
    const newTask = {
      id: originalTask.id,
      title: newOrOld('title', changes, originalTask),
      description: newOrOld('description', changes, originalTask),
      listId: newOrOld('listId', changes, originalTask),
      parentTaskId: newOrOld('parentTaskId', changes, originalTask),
      childTaskIds: newOrOld('childTaskIds', changes, originalTask),
      isDone: newOrOld('isDone', changes, originalTask),
    }

    updateTask(newTask)
  }

  function updateTask(newTask) {
    const taskId = newTask.id
    const oldTask = getTask(taskId)

    if (oldTask != null) {
      // Check to see if its list has changed
      if (oldTask.listId !== newTask.listId) {
        console.log(
          `BackendStore.updateTask: Changing list from ${oldTask.listId} to ${newTask.listId}`,
        )
        const newList = getList(newTask.listId)
        if (newList != null) {
          console.log('Before, newList had ', JSON.stringify(newList.taskIds))
          newList.taskIds.unshift(taskId)
          updateList(newList)
          console.log('After, newList has', JSON.stringify(newList.taskIds))
          const oldList = getList(oldTask.listId)
          if (oldList != null) {
            console.log('Before, oldList had ', JSON.stringify(oldList.taskIds))
            oldList.taskIds = oldList.taskIds.filter((otherTaskId) => otherTaskId !== taskId)
            updateList(oldList)
            console.log('After, oldList has ', JSON.stringify(oldList.taskIds))
          } else {
            console.warn(
              `BackendStore.updateTask: Couldn't find old list with id ${oldTask.listId} for task id ${taskId}`,
            )
          }
        } else {
          throw `Couldn't find new list with id ${newTask.listId} for task id ${taskId}`
        }
      }
      // Check to see if parent has changed
      if (oldTask.parentTaskId !== newTask.parentTaskId) {
        console.log(
          `BackendStore.updateTask: Changing parent task Id from ${oldTask.parentTaskId} to ${newTask.parentTaskId}`,
        )
        const oldParentTask = getTask(oldTask.parentTaskId)
        if (oldParentTask != null) {
          oldParentTask.childTaskIds =
            oldParentTask.childTaskIds?.filter((otherTaskId) => otherTaskId !== taskId) ?? []
          updateTask(oldParentTask)
        }
        const newParentTask = getTask(newTask.parentTaskId)
        if (newParentTask != null) {
          newParentTask.childTaskIds = (newParentTask.childTaskIds ?? []).concat(taskId)
          updateTask(newParentTask)
        }
      }

      // TODO: check to see if the parent task's children are now all completed - if so, then
      //        we can set that parent task to DONE too.

      // TODO: Transactions? See https://firebase.google.com/docs/firestore/manage-data/transactions
      // TODO: check to see if children have changed (not supported by UI yet)
    } else {
      console.warn("BackendStore.updateTask: Didn't find an existing task for", taskId, newTask)
    }

    // tasksById.value[newTask.id] = newTask
    updateDoc(doc(db, 'tasks', taskId), newTask)
  }

  function findTasks(searchString) {
    _ensureLoaded()
    const lowerCaseSearchString = searchString.toLocaleLowerCase()
    return Object.values(this._data.tasksById).filter(
      (task) =>
        task.title.toLocaleLowerCase().indexOf(lowerCaseSearchString) >= 0 ||
        task.description.toLocaleLowerCase().indexOf(lowerCaseSearchString) >= 0,
    )
  }

  return {
    _data,
    _status,
    init,
    isLoaded,
    tasks,
    lists,
    doneList,
    newItemsList,
    getTask,
    getList,
    getListForTask,
    getParentAndChildTasksForTask,
    getChildTasksForTask,
    getParentTaskForTask,
    patchList,
    updateList,
    deleteList,
    addList,
    patchTask,
    updateTask,
    addTask,
    findTasks,
  }
})

function handleDocChanges(snapshot, collectionType, containerObject) {
  snapshot.docChanges().forEach((change) => {
    const itemData = { ...change.doc.data(), id: change.doc.id }

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
