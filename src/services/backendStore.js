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
      throw 'BackendStore.getListForTask: Task was null'
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

  /**
   * Note that modifying the list's `taskIds` will not automatically
   * sync the `listId` fields of those linked tasks; you should call
   * `patchTask()` to do this.
   */
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

    return _saveList(newList)
  }

  function _saveList(newList) {
    _data.listsById[newList.id] = newList
    updateDoc(doc(db, 'lists', newList.id), newList)
    // Return a fresh reactive copy
    return getList(newList.id)
  }

  async function addList(newList) {
    // TODO: Figure out what to do when we're offline: it won't create the ID
    const newDocRef = doc(collection(db, 'lists'))
    console.log('BackendStore.addList: New document ID is ', newDocRef.id)
    newList.id = newDocRef.id
    await setDoc(newDocRef, newList)
    // const newRef = await addDoc(collection(db, 'lists'), newList)

    newList.taskIds.forEach((taskId) => {
      const task = getTask(taskId)
      if (task != null) {
        patchTask(task, { listId: newList.id })
      } else {
        console.warn(
          `BackendStore.addList: New list references taskId '${taskId}' which doesn't exist`,
        )
      }
    })

    _data.listsById[newList.id] = newList

    // Return a fresh reactive copy
    return getList(newList.id)
  }

  async function deleteList(listIdOrObject) {
    _ensureLoaded()
    const originalList =
      typeof listIdOrObject === 'string' ? getList(listIdOrObject) : listIdOrObject

    if (originalList == null) {
      console.warn(
        'BackendStore.deleteList: Attempted to delete list ',
        listIdOrObject,
        'but it was null',
      )
      return
    }

    if (originalList.taskIds.length > 0) {
      throw `Cannot delete list '${originalList.name}' because it still contains tasks`
    }

    deleteDoc(doc(db, 'lists', originalList.id))
    delete _data.listsById[originalList.id]
  }

  async function addTask(newTask) {
    // TODO: Figure out what to do when we're offline: it won't create the ID
    const newDocRef = doc(collection(db, 'tasks'))
    console.log('BackendStore.addTask: New document ID is ', newDocRef.id)
    newTask.id = newDocRef.id
    await setDoc(newDocRef, newTask)
    // const newRef = await addDoc(collection(db, 'tasks'), newTask)

    // Add it to the local collection immediately so that we can reference it
    // in components without having to wait for the later "snapshot" change.
    this._data.tasksById[newTask.id] = newTask

    const list = getList(newTask.listId)
    patchList(list, {
      taskIds: [newTask.id].concat(list.taskIds),
    })

    const parentTask = getParentTaskForTask(newTask)
    if (parentTask != null) {
      patchTask(parentTask, {
        childTaskIds: (parentTask.childTaskIds ?? []).concat(newTask.id),
      })
    }

    // TODO: Eventually, sort out mapping for any child tasks too

    // Return a fresh copy (with proxy wrapper)
    return getTask(newTask.id)
  }

  function patchTask(taskIdOrObject, changes) {
    const newOrOld = (fieldName, changes, oldObject) =>
      changes[fieldName] !== undefined ? changes[fieldName] : oldObject[fieldName]

    _ensureLoaded()
    const originalTask =
      typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject) : taskIdOrObject

    if (originalTask == null) {
      throw ("BackendStore.patchTask: can't find original task", taskIdOrObject)
    }
    originalTask
    const newTask = {
      id: originalTask.id,
      title: newOrOld('title', changes, originalTask),
      description: newOrOld('description', changes, originalTask),
      listId: newOrOld('listId', changes, originalTask),
      parentTaskId: newOrOld('parentTaskId', changes, originalTask),
      childTaskIds: newOrOld('childTaskIds', changes, originalTask),
      isDone: newOrOld('isDone', changes, originalTask),
    }

    return _saveTaskAndUpdateRelatedTasksAndLists(newTask)
  }

  function _saveTaskAndUpdateRelatedTasksAndLists(newTask) {
    const taskId = newTask.id
    const oldTask = getTask(taskId)

    if (oldTask != null) {
      // Check to see if its list has changed
      if (oldTask.listId !== newTask.listId) {
        console.log(
          `BackendStore._saveTaskAndUpdateRelatedTasksAndLists: Changing list from ${oldTask.listId} to ${newTask.listId}`,
        )
        const newList = getList(newTask.listId)
        if (newList != null) {
          console.log('Before, newList had ', JSON.stringify(newList.taskIds))
          patchList(newList, {
            taskIds: [taskId].concat(newList.taskIds),
          })
          console.log('After, newList has', JSON.stringify(newList.taskIds))
          const oldList = getList(oldTask.listId)
          if (oldList != null) {
            console.log('Before, oldList had ', JSON.stringify(oldList.taskIds))
            oldList.taskIds = oldList.taskIds.filter((otherTaskId) => otherTaskId !== taskId)
            _saveList(oldList)
            console.log('After, oldList has ', JSON.stringify(oldList.taskIds))
          } else {
            console.warn(
              `BackendStore._saveTaskAndUpdateRelatedTasksAndLists: Couldn't find old list with id ${oldTask.listId} for task id ${taskId}`,
            )
          }
        } else {
          throw `Couldn't find new list with id ${newTask.listId} for task id ${taskId}`
        }
      }
      // Check to see if parent has changed
      if (oldTask.parentTaskId !== newTask.parentTaskId) {
        console.log(
          `BackendStore._saveTaskAndUpdateRelatedTasksAndLists: Changing parent task Id from ${oldTask.parentTaskId} to ${newTask.parentTaskId}`,
        )
        const oldParentTask = getTask(oldTask.parentTaskId)
        if (oldParentTask != null) {
          oldParentTask.patchTask(oldParentTask, {
            childTaskIds:
              oldParentTask.childTaskIds?.filter((otherTaskId) => otherTaskId !== taskId) ?? [],
          })
        }
        const newParentTask = getTask(newTask.parentTaskId)
        if (newParentTask != null) {
          newParentTask.childTaskIds = (newParentTask.childTaskIds ?? []).concat(taskId)
          _saveTaskAndUpdateRelatedTasksAndLists(newParentTask)
        }
      }

      // TODO: check to see if the parent task's children are now all completed - if so, then
      //        we can set that parent task to DONE too.

      // TODO: Transactions? See https://firebase.google.com/docs/firestore/manage-data/transactions
      // TODO: check to see if children have changed (not supported by UI yet)
    } else {
      console.warn(
        "BackendStore._saveTaskAndUpdateRelatedTasksAndLists: Didn't find an existing task for",
        taskId,
        newTask,
      )
    }

    updateDoc(doc(db, 'tasks', taskId), newTask)
    _data.tasksById[newTask.id] = newTask

    // Return a fresh reactive copy
    return getTask(newTask.id)
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
    updateList: _saveList,
    deleteList,
    addList,
    patchTask,
    _saveTaskAndUpdateRelatedTasksAndLists,
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
