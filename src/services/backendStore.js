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
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import {
  getCurrentUserOnceFirebaseHasLoaded,
  isBlank,
  isEmpty,
  single,
  timestampNow,
} from './utils'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useLogger } from './logger'
import { validateList } from './validator'

const { log, info, warn } = useLogger('BackendStore')

log(`App ID env var is '${import.meta.env['VITE_FIREBASE_PROJECT_ID']}'`)

// Will come from .env.local
let credentials = {
  apiKey: import.meta.env['VITE_FIREBASE_API_KEY'],
  authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'],
  projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'],
  storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
  appId: import.meta.env['VITE_FIREBASE_APP_ID'],
}

// TODO: Should this not be done in the main app script?
export const firebaseApp = initializeApp(credentials)
initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

const db = getFirestore(firebaseApp)

export const useBackendStore = defineStore('backendStore', () => {
  const _data = reactive({ listsById: {}, tasksById: {} })
  const lists = computed(() =>
    Object.values(_data.listsById).toSorted((a, b) => (a.order > b.order ? 1 : -1)),
  )
  const tasks = computed(() => Object.values(_data.tasksById))

  const doneList = computed(() =>
    single(Object.values(_data.listsById), (list) => list.specialCategory === 'DONE', {
      failOnMultipleMatches: false,
    }),
  )

  const newItemsList = computed(() =>
    single(Object.values(_data.listsById), (list) => list.specialCategory === 'TODAY', {
      failOnMultipleMatches: false,
    }),
  )

  const _status = reactive({
    overallStatus: 'NOT_STARTED',
    currentUserId: null,
    dataIntegrityWarnings: [],
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
            query(collection(db, collectionType), where('ownerId', '==', user.uid)),
            async (snapshot) => {
              log('Snapshot received')
              _handleDocChanges(snapshot, collectionType, _data[`${collectionType}ById`])
              entityStatus.isLoaded = true

              if (_status.lists.isLoaded && _status.tasks.isLoaded) {
                if (_status.overallStatus === 'LOADING_DOCUMENTS_FOR_USER') {
                  _status.overallStatus = 'CHECKING_DATA_INTEGRITY'
                  await _createDefaultListsIfNecessary()
                  await _checkDataIntegrity()
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
      throw '[BackendStore] Attempted to access tasks or lists before data was loaded'
    }
  }

  function getTask(taskId, throwIfNotFound) {
    _ensureLoaded()
    const task = _data.tasksById[taskId]
    if (task == null) {
      const message = `[BackendStore.getTask] Task id '${taskId}' was not found`
      if (throwIfNotFound) {
        throw message
      } else {
        console.warn(message)
        return null
      }
    }
    return task
  }

  function getList(listId, throwIfNotFound) {
    _ensureLoaded()
    const list = _data.listsById[listId]
    if (list == null) {
      const message = `[BackendStore.getList] List with id '${listId}' was not found`
      if (throwIfNotFound) {
        throw message
      } else {
        console.warn(message)
        return null
      }
    }
    return list
  }

  function getListForTask(taskIdOrObject) {
    _ensureLoaded()
    const task = typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject, true) : taskIdOrObject

    if (task.listId === null) {
      throw `[BackendStore.getListForTask] Task with id ${task.id} has no listId`
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

  /**
   * Note that modifying the list's `taskIds` will not automatically
   * sync the `listId` fields of those linked tasks; you should call
   * `patchTask()` to do this.
   */
  async function patchList(listIdOrObject, changes) {
    _ensureLoaded()

    const originalList =
      typeof listIdOrObject === 'string' ? getList(listIdOrObject, true) : listIdOrObject

    // TODO: Make sure we're using this in all the likely places
    validateList(originalList, _data.tasksById)

    const newList = {
      ...originalList,
      name: _newOrOld('name', changes, originalList),
      order: _newOrOld('order', changes, originalList),
      taskIds: _newOrOld('taskIds', changes, originalList),
      version: originalList.version,
    }

    return await _saveList(newList)
  }

  async function _saveList(newList) {
    newList.modifiedTimestamp = timestampNow()
    newList.version = (newList.version ?? 0) + 1
    validateList(newList, _data.tasksById)

    _data.listsById[newList.id] = newList
    updateDoc(doc(db, 'lists', newList.id), newList)
    // Return a fresh reactive copy
    return getList(newList.id, true)
  }

  async function addList(list) {
    if (isEmpty(list?.name)) {
      throw `[BackendStore.addList] New list must contain a valid name (got '${list?.name}')`
    }

    if (!isEmpty(list.id)) {
      throw `[BackendStore.addList] The provided list already has an ID ('${list.id}')`
    }

    // TODO: Figure out what to do when we're offline: it won't create the ID
    const newDocRef = doc(collection(db, 'lists'))
    log('New list ID is ', newDocRef.id)

    const now = timestampNow()

    const newList = {
      id: newDocRef.id,
      name: list.name,
      taskIds: list.taskIds ?? [],
      specialCategory: list.specialCategory ?? null,
      order: list.order ?? _nextListOrderValue(_data.listsById),
      ownerId: getAuth().currentUser.uid,
      createdTimestamp: now,
      modifiedTimestamp: now,
    }

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
      throw `[BackendStore.deleteList] Cannot delete list '${originalList.name}' because it still contains tasks`
    }

    deleteDoc(doc(db, 'lists', originalList.id))
    delete _data.listsById[originalList.id]
  }

  async function addTask(newFields) {
    if (isEmpty(newFields.title) || isEmpty(newFields.listId)) {
      throw '[BackendStore.addTask] You must specify at least a title and a listId!'
    }

    // TODO: Figure out what to do when we're offline: it won't create the ID
    const newDocRef = doc(collection(db, 'tasks'))
    log('addTask: New document ID is ', newDocRef.id)

    const now = timestampNow()
    const isDone = newFields.isDone ?? false

    const newTask = {
      id: newDocRef.id,
      listId: newFields.listId,
      title: newFields.title,
      description: newFields.description ?? '',
      parentTaskId: newFields.parentTaskId ?? null,
      childTaskIds: newFields.childTaskIds ?? [],
      isDone: isDone,
      ownerId: getAuth().currentUser.uid,
      createdTimestamp: newFields.createdTimestamp ?? now,
      modifiedTimestamp: now,
      doneTimestamp: isDone ? (newFields.doneTimestamp ?? now) : null,
      dueByTimestamp: newFields.dueByTimestamp ?? null,
    }

    log('Saving task', newTask)

    await setDoc(newDocRef, newTask)

    // Add it to the local collection immediately so that we can reference it
    // in components without having to wait for the later "snapshot" change.
    this._data.tasksById[newTask.id] = newTask

    // Update links in the List
    const list = getList(newTask.listId, true)
    list.taskIds = [newTask.id, ...list.taskIds]

    await _saveList(list)

    // Update links in the parent task (if any)
    const parentTask = getParentTaskForTask(newTask)
    if (parentTask != null) {
      parentTask.childTaskIds = [...(parentTask.childTaskIds ?? []), newTask.id]
      _saveTask(parentTask)
    }

    // Update links in the child tasks (if any)
    newTask.childTaskIds.forEach(async (childTaskId) => {
      const childTask = getTask(childTaskId, true)
      if (childTask.parentTaskId != null) {
        throw `[BackendStore.addTask] Trying to add child task '${childTaskId}' but that task already has a parent (id ${childTask.parentTaskId})`
      }
      // TODO: Other validation, e.g. make sure that the child task Id !== thisTaskId
      childTask.parentTaskId = newTask.id
      await _saveTask(childTask)
    })

    // Return a fresh copy (with proxy wrapper)
    return getTask(newTask.id)
  }

  async function patchTask(taskIdOrObject, changes) {
    _ensureLoaded()
    const originalTask =
      typeof taskIdOrObject === 'string' ? getTask(taskIdOrObject, true) : taskIdOrObject

    const newTask = {
      ...originalTask,
      title: _newOrOld('title', changes, originalTask),
      description: _newOrOld('description', changes, originalTask),
      listId: _newOrOld('listId', changes, originalTask),
      parentTaskId: _newOrOld('parentTaskId', changes, originalTask),
      childTaskIds: _newOrOld('childTaskIds', changes, originalTask),
      isDone: _newOrOld('isDone', changes, originalTask),
      dueByTimestamp: _newOrOld('dueByTimestamp', changes, originalTask),
      version: originalTask.version,
    }

    newTask.doneTimestamp = newTask.isDone ? (originalTask.doneTimestamp ?? timestampNow()) : null

    const taskId = newTask.id

    // Check to see if its list has changed
    if (originalTask.listId !== newTask.listId) {
      log(`patchTask: Changing list from ${originalTask.listId} to ${newTask.listId}`)
      const oldList = getList(originalTask.listId, true)
      const newList = getList(newTask.listId, true)

      lists.value.forEach(async (list) => {
        // It's safest to remove our task from ALL the lists where it
        // might be.
        const prevNumTaskIds = list.taskIds.length
        list.taskIds = list.taskIds.filter((otherTaskId) => otherTaskId !== taskId)

        if (list.id === newTask.listId) {
          list.taskIds = [newTask.id, ...newList.taskIds]
          await _saveList(oldList)
        } else if (list.taskIds.length !== prevNumTaskIds) {
          await _saveList(oldList)
        }
      })
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
        await _saveTask(oldParentTask)
      }

      if (newTask.parentTaskId != null) {
        const newParentTask = getTask(newTask.parentTaskId, true)
        newParentTask.childTaskIds = (newParentTask.childTaskIds ?? []).concat(taskId)
        await _saveTask(newParentTask)
      }
    }

    // TODO: check to see if the parent task's children are now all completed - if so, then
    //        we can set that parent task to DONE too.
    const oldChildTaskIds = new Set(originalTask.childTaskIds)
    const newChildTaskIds = new Set(newTask.childTaskIds)

    // Find tasks which are no longer children of this task
    oldChildTaskIds.difference(newChildTaskIds).forEach(async (oldChildTaskId) => {
      const oldChildTask = getTask(oldChildTaskId, true)
      if (oldChildTask.parentTaskId === taskId) {
        log(
          `patchTask: Task '${oldChildTask.title}' (${oldChildTaskId}) should no longer be a child of '${newTask.title}' - will make it an orphan`,
        )
        oldChildTask.parentTaskId = null
        await _saveTask(oldChildTask)
      }
    })

    // Make sure all the new child tasks are all correctly assigned to this one
    newChildTaskIds.forEach(async (newChildTaskId) => {
      const newChildTask = getTask(newChildTaskId, true)
      if (newChildTask.parentTaskId !== taskId) {
        log(
          `patchTask: Task '${newChildTask.title}' (${newChildTaskId}) should now be made a child of '${newTask.title}'`,
        )
        newChildTask.parentTaskId = taskId
        await _saveTask(newChildTask)
      }
    })

    // TODO: Transactions? See https://firebase.google.com/docs/firestore/manage-data/transactions

    return await _saveTask(newTask)
  }

  /**
   * No frills save method: it takes the given object, updates it in the DB, makes sure that it's
   * stored locally in _data, and returns that fresh reactive reference.
   * It doesn't attempt to sync any child/parent task IDs, or list IDs.
   */
  async function _saveTask(updatedTask) {
    updatedTask.modifiedTimestamp = timestampNow()
    updatedTask.version = (updatedTask.version ?? 0) + 1
    _data.tasksById[updatedTask.id] = updatedTask
    await updateDoc(doc(db, 'tasks', updatedTask.id), updatedTask)

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
      throw `[BackendStore.deleteTask] Can't delete task with ID '${task.id}' because it has children`
    }

    const list = getListForTask(task)

    await deleteDoc(doc(db, 'tasks', task.id))
    delete _data.tasksById[task.id]

    list.taskIds = list.taskIds.filter((otherTaskId) => otherTaskId !== task.id)
    list.modifiedTimestamp = timestampNow()
    await _saveList(list)

    task.childTaskIds.forEach(async (childTaskId) => {
      const childTask = getTask(childTaskId)
      if (childTask != null) {
        childTask.parentTaskId = null
        childTask.modifiedTimestamp = timestampNow()
        await _saveTask(childTask)
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

  async function archiveDoneTasks() {
    /*
        Only mark a task as archivable if:
            - It's done
            - doneTimestamp is a while ago (TODO)
            - Its parent task (if any, and _its_ parent task, and so on) is also archivable
            - All of its child tasks (if any) are also archivable
    */
    const nonArchivableTaskIds = new Set(
      this.tasks.filter((task) => task.isDone !== true).map((task) => task.id),
    )
    let candidateTasks = this.tasks.filter((task) => task.isDone === true)

    const recordNonArchivableAncestors = (task) => {
      if (nonArchivableTaskIds.has(task.id)) {
        return true
      }
      const parentTask = getParentTaskForTask(task)
      if (parentTask != null && recordNonArchivableAncestors(parentTask)) {
        nonArchivableTaskIds.add(task.id)
        return true
      }
      return false
    }

    const recordNonArchivableDescendants = (task) => {
      if (nonArchivableTaskIds.has(task.id)) {
        return true
      }
      const childTasks = getChildTasksForTask(task)
      if (childTasks.filter((childTask) => recordNonArchivableDescendants(childTask)).length > 0) {
        nonArchivableTaskIds.add(task.id)
        return true
      }
      return false
    }

    // Check for non-archivable parents first
    candidateTasks.forEach((task) => {
      recordNonArchivableAncestors(task)
    })

    // Now check for non-archivable children
    candidateTasks.forEach((task) => {
      recordNonArchivableDescendants(task)
    })

    // Finally, see what we're left with
    candidateTasks = candidateTasks.filter((task) => !nonArchivableTaskIds.has(task.id))

    candidateTasks.forEach(async (task) => {
      log(`We might actually be able to archive task '${task.title}' (id ${task.id})`)
      // TODO: Delete the doc and re-create it in the archived_tasks collection with:
      //     - listId: null
      //    Then remove it from its current list

      setDoc(doc(db, 'archived_tasks', task.id), {
        ...task,
        archivedTimestamp: timestampNow(),
      })

      task.parentTask = null
      task.childTaskIds = []
      await deleteTask(task)
    })

    return candidateTasks.length
  }

  function getArchivedTasks() {
    return new Promise(async (resolve) => {
      const user = await getCurrentUserOnceFirebaseHasLoaded()
      log('User is ', user)
      const removeListener = onSnapshot(
        query(collection(db, 'archived_tasks'), where('ownerId', '==', user.uid)),
        async (snapshot) => {
          log('Archived snapshot received')
          const archivedTasks = snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id }
          })
          removeListener()
          resolve(archivedTasks)
        },
      )
    })
  }

  async function _createDefaultListsIfNecessary() {
    const defaultListNames = ['Backlog', 'Today', 'Done']

    defaultListNames.forEach(async (name, index) => {
      const specialCategory = name.toUpperCase()
      const allLists = Object.values(_data.listsById)

      const matchingLists = allLists.filter((list) => list.specialCategory === specialCategory)

      if (matchingLists.length === 0) {
        info(`Creating missing default list '${specialCategory}'`)
        await addList({
          name: name,
          specialCategory: specialCategory,
          taskIds: [],
          order: allLists.length + index,
        })
      } else if (matchingLists.length > 1) {
        warn(
          `Found multiple (${matchingLists.length}) default '${specialCategory}' lists! Will consolidate them.`,
        )

        // Pick the list with the most tasks to keep
        const survivorList = matchingLists.reduce((longestList, thisList) => {
          const thisLength = thisList.taskIds.length
          log(`- '${specialCategory}' list ${thisList.id} has ${thisLength} task(s)`)
          return longestList == null || thisLength > longestList.taskIds.length
            ? thisList
            : longestList
        })

        log(`Choosing list ${survivorList.id} to keep, as it has the most tasks.`)

        matchingLists.forEach(async (list) => {
          if (list.id !== survivorList.id) {
            // Move non-clashing items across to the survivor list
            list.taskIds.forEach(async (taskId) => {
              const task = getTask(taskId, false)
              if (task != null && survivorList.taskIds.indexOf(taskId) < 0) {
                log(
                  `- Moving task ${taskId} ('${task.title}') from list ${list.id} to ${survivorList.id}`,
                )
                await patchTask(task, { listId: survivorList.id })
              }
            })

            log(`- Deleting duplicate '${specialCategory}' list ${list.id}`)
            deleteList(list)
          }
        })
      }
    })
  }

  async function _checkDataIntegrity() {
    log('Checking data integrity')
    _status.dataIntegrityWarnings = []

    const addDataIntegrityWarning = (message) => {
      warn(message)
      _status.dataIntegrityWarnings.push(message)
    }

    Object.values(_data.listsById).forEach((list) => {
      list.taskIds.forEach((taskId) => {
        if (!_data.tasksById[taskId]) {
          addDataIntegrityWarning(
            `List '${list.name}' (id ${list.id}) references unknown task ID '${taskId}'`,
          )
        }
      })
    })

    Object.values(_data.tasksById).forEach(async (task) => {
      const descriptor = `Task '${task.title}' (id ${task.id})`
      const list = _data.listsById[task.listId]

      if (list == null) {
        addDataIntegrityWarning(`${descriptor} references unknown list ID '${task.listId}'`)
      } else {
        if (list.taskIds.indexOf(task.id) < 0) {
          addDataIntegrityWarning(
            `${descriptor} is not listed in the taskIds of its list (id ${task.listId})`,
          )

          // Try to add it in
          await patchList(list, { taskIds: [...list.taskIds, task.id] })
        }
      }

      if (task.parentTaskId === task.id) {
        addDataIntegrityWarning(`${descriptor} self-references itself as a parent`)
      }

      if (task.parentTaskId != null && !_data.tasksById[task.parentTaskId]) {
        addDataIntegrityWarning(
          `${descriptor} references unknown parent task ID '${task.parentTaskId}'`,
        )
      }

      if (task.childTaskIds.includes(task.id)) {
        addDataIntegrityWarning(`${descriptor} self-references itself as a child`)
      }
      if (task.parentTaskId != null && task.childTaskIds.includes(task.parentTaskId)) {
        addDataIntegrityWarning(
          `${descriptor} includes other task id '${task.parentTaskId}' as both a parent and a child`,
        )
      }

      task.childTaskIds.forEach((childTaskId) => {
        if (!_data.tasksById[childTaskId]) {
          addDataIntegrityWarning(`${descriptor} references unknown child task ID '${childTaskId}'`)
        }
      })
    })
  }

  function createBackupJson() {
    _ensureLoaded()
    return JSON.stringify(_data, null, 2)
  }

  async function restoreFromBackupJson(jsonString) {
    _ensureLoaded()
    log('restoreFromBackupJson: starting')
    const newData = JSON.parse(jsonString)

    const collectionTypes = ['lists', 'tasks']
    const mapNameFor = (collectionType) => `${collectionType}ById`

    // Check the backup contents first
    for (let collectionType of collectionTypes) {
      const mapName = mapNameFor(collectionType)

      if (newData[mapName] == null) {
        throw `Backup must contain ${mapName}`
      }

      const numItems = Object.keys(newData[mapName]).length
      log(`restoreFromBackupJson: backup contains ${numItems} in ${collectionType}`)
    }

    for (let collectionType of ['lists', 'tasks']) {
      const mapName = mapNameFor(collectionType)

      // 1. Delete existing items that aren't in our newData
      Object.values(_data[mapName]).forEach((item) => {
        const id = item.id
        if (newData[mapName][id] == null) {
          log(
            `DELETING no-longer-referenced item from ${collectionType}: id ${id} ('${item.name ?? item.title}')`,
          )
          delete _data[mapName][id]
          deleteDoc(doc(db, collectionType, id))
        }
      })

      // 2. Add/set all items in our newData
      Object.values(newData[mapName]).forEach((item) => {
        const id = item.id
        log(`Writing item to ${collectionType}: id ${id} ('${item.name ?? item.title}')`)
        _data[mapName][id] = item
        setDoc(doc(db, collectionType, id), item)
      })
    }

    _checkDataIntegrity()
    _createDefaultListsIfNecessary()

    log('restoreFromBackupJson: complete')
  }

  return {
    _data,
    _status,
    _checkDataIntegrity,
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
    archiveDoneTasks,
    getArchivedTasks,
    createBackupJson,
    restoreFromBackupJson,
  }
})

function _handleDocChanges(snapshot, collectionType, containerObject) {
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

function _newOrOld(fieldName, newObject, oldObject) {
  return newObject[fieldName] !== undefined ? newObject[fieldName] : (oldObject[fieldName] ?? null)
}

function _validateTask(task) {
  // TODO: implement this, and use it in more places above.
}

function _nextListOrderValue(listsById) {
  const lists = Object.values(listsById)

  if (lists.length === 0) {
    return 0
  } else {
    return lists.reduce((maxSoFar, list) => Math.max(maxSoFar, list.order), -1) + 1
  }
}
