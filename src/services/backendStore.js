import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import credentials from '@/../firebaseCredentials.json'
import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import { single } from './utils'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useLogger } from './logger'

const { log, info, warn } = useLogger('BackendStore')

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
    setDoc(doc(db, collectionType, item.id), { ownerId: getAuth().currentUser.uid, ...item }),
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

  const doneList = computed(() =>
    single(Object.values(_data.listsById), (list) => list.specialCategory === 'DONE'),
  )

  const newItemsList = computed(() =>
    single(Object.values(_data.listsById), (list) => list.specialCategory === 'TODAY'),
  )

  const _status = reactive({
    overallStatus: 'NOT_STARTED',
    currentUserId: null,
    lists: {
      unsubscribeCallback: null,
      isLoaded: false,
    },
    tasks: {
      unsubscribeCallback: null,
      isLoaded: false,
    },
  })

  const isLoaded = computed(() => _status.overallStatus === 'LOADING_COMPLETE')

  // Sync Firestore -> Pinia
  const init = () => {
    if (_status.overallStatus !== 'NOT_STARTED') {
      warn(`[BackendStore]: init() was called when overallStatus was '${_status.overallStatus}'`)
      return
    }

    _status.overallStatus = 'WAITING_FOR_USER_LOGIN'

    onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        log('[BackendStore]: User has logged out, so clearing caches.')
        _data.listsById = {}
        _data.tasksById = {}

        for (let collectionType of ['lists', 'tasks']) {
          const entityStatus = _status[collectionType]
          entityStatus.isLoaded = false
          if (entityStatus.unsubscribeCallback) {
            entityStatus.unsubscribeCallback()
            entityStatus.unsubscribeCallback = null
          }
        }

        _status.currentUserId = null
        _status.overallStatus = 'WAITING_FOR_USER_LOGIN'
        return
      }

      if (_status.currentUserId !== null && user.uid === _status.currentUserId) {
        warn('onAuthStateChanged, but userId is the same as current stored one', user)
        return
      }

      _status.currentUserId = user.uid
      _status.overallStatus = 'LOADING_DOCUMENTS_FOR_USER'

      for (let collectionType of ['lists', 'tasks']) {
        const entityStatus = _status[collectionType]

        // avoid duplicate listeners
        if (entityStatus.unsubscribeCallback === null) {
          entityStatus.unsubscribeCallback = onSnapshot(
            //collection(db, collectionType),
            query(collection(db, collectionType), where('ownerId', '==', user.uid)),
            async (snapshot) => {
              log('Snapshot')
              handleDocChanges(snapshot, collectionType, _data[`${collectionType}ById`])
              entityStatus.isLoaded = true

              if (collectionType === 'lists') {
                if (_status.overallStatus === 'LOADING_DOCUMENTS_FOR_USER') {
                  _status.overallStatus = 'CHECKING_FOR_DEFAULT_LISTS'
                  await _createDefaultListsIfNecessary(snapshot)
                  _status.overallStatus = 'WAITING_FOR_ENTITY_LOADING_TO_COMPLETE'
                }
              }

              if (_status.overallStatus === 'WAITING_FOR_ENTITY_LOADING_TO_COMPLETE') {
                if (_status.lists.isLoaded && _status.tasks.isLoaded) {
                  _status.overallStatus = 'LOADING_COMPLETE'
                }
              }
            },
          )
        }
      }
    })
  }

  function _ensureLoaded() {
    if (!isLoaded) {
      throw 'backendStore: attempted to access tasks or lists before data was loaded'
    }
  }

  function getTask(taskId, throwIfNotFound) {
    _ensureLoaded()
    const task = _data.tasksById[taskId]
    if (task == null) {
      const message = `BackendStore.getTask: Task id '${taskId}' was not found`
      if (throwIfNotFound) {
        throw message
      } else {
        warn(message)
        return null
      }
    }
    return task
  }

  function getList(listId, throwIfNotFound) {
    _ensureLoaded()
    const list = _data.listsById[listId]
    if (list == null) {
      const message = `BackendStore.getList: List id '${listId}' was not found`
      if (throwIfNotFound) {
        throw message
      } else {
        warn(message)
        return null
      }
    }
    return list
  }

  function getListForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject, true) : taskIdOrObject

    if (task.listId === null) {
      throw `backendStore.getListForTask: Task id ${task.id} has no listId`
    }

    return getList(task.listId, true)
  }

  function getParentAndChildTasksForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject, true) : taskIdOrObject
    return {
      parentTask: getParentTaskForTask(task),
      childTasks: getChildTasksForTask(task),
    }
  }

  function getChildTasksForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject, true) : taskIdOrObject
    return (
      task?.childTaskIds
        ?.map((childTaskId) => getTask(childTaskId, true))
        ?.filter((childTask) => childTask != null) ?? []
    )
  }

  function getParentTaskForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject, true) : taskIdOrObject
    return task?.parentTaskId == null ? null : getTask(task.parentTaskId, true)
  }

  const _newOrOld = (fieldName, newObject, oldObject) =>
    newObject[fieldName] !== undefined ? newObject[fieldName] : oldObject[fieldName]

  /**
   * Note that modifying the list's `taskIds` will not automatically
   * sync the `listId` fields of those linked tasks; you should call
   * `patchTask()` to do this.
   */
  function patchList(listIdOrObject, changes) {
    _ensureLoaded()
    const originalList =
      typeof listIdOrObject === 'string' ? getList(listIdOrObject, true) : listIdOrObject

    if (originalList == null) {
      throw ("patchList: can't find original list", listIdOrObject)
    }

    const newList = {
      id: originalList.id,
      name: _newOrOld('name', changes, originalList),
      order: _newOrOld('order', changes, originalList),
      taskIds: _newOrOld('taskIds', changes, originalList),
    }

    return _saveList(newList)
  }

  function _saveList(newList) {
    _data.listsById[newList.id] = newList
    updateDoc(doc(db, 'lists', newList.id), newList)
    // Return a fresh reactive copy
    return getList(newList.id, true)
  }

  async function addList(newList) {
    // TODO: Figure out what to do when we're offline: it won't create the ID
    const newDocRef = doc(collection(db, 'lists'))
    log('addList: New document ID is ', newDocRef.id)
    newList.id = newDocRef.id
    newList.ownerId = getAuth().currentUser.uid
    await setDoc(newDocRef, newList)
    // const newRef = await addDoc(collection(db, 'lists'), newList)

    newList.taskIds.forEach((taskId) => {
      const task = getTask(taskId, true)
      task.listId = newList.id
      _saveTask(task)
    })

    _data.listsById[newList.id] = newList

    // Return a fresh reactive copy
    return getList(newList.id, true)
  }

  async function deleteList(listIdOrObject) {
    _ensureLoaded()
    const originalList =
      typeof listIdOrObject === 'string' ? getList(listIdOrObject) : listIdOrObject

    if (originalList == null) {
      warn('deleteList: Attempted to delete list ', listIdOrObject, 'but it was null')
      return
    }

    if (originalList.taskIds.length > 0) {
      throw `Cannot delete list '${originalList.name}' because it still contains tasks`
    }

    deleteDoc(doc(db, 'lists', originalList.id))
    delete _data.listsById[originalList.id]
  }

  async function addTask(newFields) {
    if (newFields.title == null || newFields.listId == null) {
      throw 'BackendStore.addTask: You must specify at least a title and a listId!'
    }

    // TODO: Figure out what to do when we're offline: it won't create the ID
    const newDocRef = doc(collection(db, 'tasks'))
    log('addTask: New document ID is ', newDocRef.id)

    const newTask = {
      id: newDocRef.id,
      listId: newFields.listId,
      title: newFields.title,
      description: newFields.description ?? '',
      parentTaskId: newFields.parentTaskId ?? null,
      childTaskIds: newFields.childTaskIds ?? [],
      isDone: newFields.isDone ?? 'DONE' == newFields.listId,
      ownerId: getAuth().currentUser.uid,
    }

    await setDoc(newDocRef, newTask)

    // Add it to the local collection immediately so that we can reference it
    // in components without having to wait for the later "snapshot" change.
    this._data.tasksById[newTask.id] = newTask

    // Update links in the List
    const list = getList(newTask.listId, true)
    list.taskIds = [newTask.id, ...list.taskIds]
    _saveList(list)

    // Update links in the parent task (if any)
    const parentTask = getParentTaskForTask(newTask)
    if (parentTask != null) {
      parentTask.childTaskIds = [...(parentTask.childTaskIds ?? []), newTask.id]
      _saveTask(parentTask)
    }

    // Update links in the child tasks (if any)
    newTask.childTaskIds.forEach((childTaskId) => {
      const childTask = getTask(childTaskId, true)
      if (childTask.parentTaskId != null) {
        throw `BackendStore.addTask: Trying to add child task '${childTaskId}' but that task already has a parent (id ${childTask.parentTaskId})`
      }
      // TODO: Other validation, e.g. make sure that the child task Id !== thisTaskId
      childTask.parentTaskId = newTask.id
      _saveTask(childTask)
    })

    // Return a fresh copy (with proxy wrapper)
    return getTask(newTask.id)
  }

  async function patchTask(taskIdOrObject, changes) {
    _ensureLoaded()
    const originalTask =
      typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject, true) : taskIdOrObject

    const newTask = {
      id: originalTask.id,
      title: _newOrOld('title', changes, originalTask),
      description: _newOrOld('description', changes, originalTask),
      listId: _newOrOld('listId', changes, originalTask),
      parentTaskId: _newOrOld('parentTaskId', changes, originalTask),
      childTaskIds: _newOrOld('childTaskIds', changes, originalTask),
      isDone: _newOrOld('isDone', changes, originalTask),
    }

    const taskId = newTask.id

    // Check to see if its list has changed
    if (originalTask.listId !== newTask.listId) {
      log(`patchTask: Changing list from ${originalTask.listId} to ${newTask.listId}`)
      const oldList = getList(originalTask.listId, true)
      const newList = getList(newTask.listId, true)

      oldList.taskIds = oldList.taskIds.filter((childTaskId) => childTaskId !== taskId)
      _saveList(oldList)

      newList.taskIds = [taskId, ...newList.taskIds]
      _saveList(newList)
    }

    // Check to see if parent task has changed
    if (originalTask.parentTaskId !== newTask.parentTaskId) {
      log(
        `patchTask: Changing parent task Id from ${originalTask.parentTaskId} to ${newTask.parentTaskId}`,
      )

      if (originalTask.parentTaskId != null) {
        const oldParentTask = getTask(originalTask.parentTaskId, true)
        oldParentTask.childTaskIds =
          oldParentTask.childTaskIds?.filter((childTaskId) => childTaskId !== taskId) ?? []
        _saveTask(oldParentTask)
      }

      if (newTask.parentTaskId != null) {
        const newParentTask = getTask(newTask.parentTaskId, true)
        newParentTask.childTaskIds = (newParentTask.childTaskIds ?? []).concat(taskId)
        _saveTask(newParentTask)
      }
    }

    // TODO: check to see if the parent task's children are now all completed - if so, then
    //        we can set that parent task to DONE too.
    const oldChildTaskIds = new Set(originalTask.childTaskIds)
    const newChildTaskIds = new Set(newTask.childTaskIds)

    // Find tasks which are no longer children of this task
    oldChildTaskIds.difference(newChildTaskIds).forEach((oldChildTaskId) => {
      const oldChildTask = getTask(oldChildTaskId, true)
      if (oldChildTask.parentTaskId === taskId) {
        log(
          `patchTask: Task '${oldChildTask.title}' (${oldChildTaskId}) should no longer be a child of '${newTask.title}' - will make it an orphan`,
        )
        oldChildTask.parentTaskId = null
        _saveTask(oldChildTask)
      }
    })

    // Make sure all the new child tasks are all correctly assigned to this one
    newChildTaskIds.forEach((newChildTaskId) => {
      const newChildTask = getTask(newChildTaskId, true)
      if (newChildTask.parentTaskId !== taskId) {
        log(
          `patchTask: Task '${newChildTask.title}' (${newChildTaskId}) should now be made a child of '${newTask.title}'`,
        )
        newChildTask.parentTaskId = taskId
        _saveTask(newChildTask)
      }
    })

    // TODO: Transactions? See https://firebase.google.com/docs/firestore/manage-data/transactions

    return _saveTask(newTask)
  }

  /**
   * No frills save method: it takes the given object, updates it in the DB, makes sure that it's
   * stored locally in _data, and returns that fresh reactive reference.
   * It doesn't attempt to sync any child/parent task IDs, or list IDs.
   */
  function _saveTask(updatedTask) {
    updateDoc(doc(db, 'tasks', updatedTask.id), updatedTask)
    _data.tasksById[updatedTask.id] = updatedTask

    // Return a fresh reactive copy
    return getTask(updatedTask.id, true)
  }

  async function deleteTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject) : taskIdOrObject

    if (task == null) {
      warn('deleteTask: Attempted to delete task ', taskIdOrObject, 'but it was null')
      return
    }

    if (task.childTaskIds.length > 0) {
      throw ("BackendStore.deleteTask: Can't delete task", task, 'because it has children')
    }

    const list = getListForTask(task)

    deleteDoc(doc(db, 'tasks', task.id))
    delete _data.tasksById[task.id]

    list.taskIds = list.taskIds.filter((otherTaskId) => otherTaskId !== task.id)
    _saveList(list)

    task.childTaskIds.forEach((childTaskId) => {
      const childTask = getTask(childTaskId)
      if (childTask != null) {
        childTask.parentTaskId = null
        _saveTask(childTask)
      }
    })
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

  async function _createDefaultListsIfNecessary(listsSnapshot) {
    const defaultListNames = ['Backlog', 'Today', 'Done']

    defaultListNames.forEach(async (name, index) => {
      const specialCategory = name.toUpperCase()
      if (!listsSnapshot.docs.find((doc) => doc.data().specialCategory === specialCategory)) {
        info(`Creating default list '${specialCategory}'`)
        await addList({
          name: name,
          specialCategory: specialCategory,
          taskIds: [],
          order: listsSnapshot.docs.length + index,
        })
      }
    })
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
    addList,
    patchList,
    deleteList,
    addTask,
    patchTask,
    deleteTask,
    findTasks,
  }
})

function handleDocChanges(snapshot, collectionType, containerObject) {
  snapshot.docChanges().forEach((change) => {
    const itemData = { ...change.doc.data(), id: change.doc.id }

    switch (change.type) {
      case 'added':
        log(`handleDocChange: DB reports ADD in ${collectionType}: id=${itemData.id}`)
        containerObject[itemData.id] = itemData
        break

      case 'modified':
        log(`handleDocChange: DB reports UPDATE in ${collectionType}: id=${itemData.id}`)
        containerObject[itemData.id] = itemData
        // We shouldn't need to worry about updating child and parent IDs - they should also be saved in the DB.
        break

      case 'removed':
        log(`handleDocChange: DB reports DELETE in ${collectionType}: id=${itemData.id}`)
        delete containerObject[itemData.id]
        break

      default:
        warn(
          `handleDocChange: Unknown change type '${change.type}' for ${collectionType} id=${itemData.id}`,
        )
        break
    }
  })
}
