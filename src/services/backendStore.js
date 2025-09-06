// import { initializeApp } from 'firebase/app'
// import {
//   getFirestore,
//   collection,
//   getDocs,
//   setDoc,
//   deleteDoc,
//   doc,
//   onSnapshot,
// } from 'firebase/firestore'
// import credentials from '@/../firebaseCredentials.json'
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
// import { ref } from 'firebase/database'

// export const firebaseApp = initializeApp(credentials)

// // used for the firestore refs
// const db = getFirestore(firebaseApp)

// // here we can export reusable database references

// const tasksRef = collection(db, 'tasks')
// const listsRef = collection(db, 'lists')

const defaultData = {
  lists: {
    1: {
      id: '1',
      name: 'Done',
      taskIds: ['1000'],
    },
    2: {
      id: '2',
      name: 'Backlog',
      taskIds: ['2000', '3000'],
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

// async function repopulateCollection(ref, typeName, items) {
//   const snapshot = await getDocs(ref)
//   const deletions = snapshot.docs.map((d) => deleteDoc(doc(db, typeName, d.id)))
//   await Promise.all(deletions)

//   const writes = items.map((item) => setDoc(doc(db, typeName, item.id), item))
//   await Promise.all(writes)
// }

// export async function resetDb() {
//   repopulateCollection(tasksRef, 'tasks', Object.values(defaultData.tasks))
//   repopulateCollection(listsRef, 'lists', Object.values(defaultData.lists))
// }

//await resetDb()

export const useBackendStore = defineStore('backendStore', () => {
  const count = ref(0)
  const listsById = reactive(defaultData.lists)
  const tasksById = reactive(defaultData.tasks)
  const name = ref('eduardo')
  const doubleCount = computed(() => count.value * 2)
  // TODO: Why doesn't the id field make it through?
  //   const childTasksForTask = computed((id) => {
  //     const task = tasksById[id]
  //     return task === null
  //       ? null
  //       : task.childTaskIds
  //           .map((childTaskId) => tasksById[childTaskId])
  //           .filter((childTask) => childTask !== null)
  //   })

  function childTasksForTask(taskId) {
    const task = tasksById[taskId]
    return task === null
      ? null
      : task.childTaskIds
          .map((childTaskId) => tasksById[childTaskId])
          .filter((childTask) => childTask !== null)
  }
  function parentTaskForTask(taskId) {
    const task = tasksById[taskId]
    return task?.parentTaskId == null ? null : tasksById[task.parentTaskId]
  }

  // TODO: Maybe create separate methods instead, for the UI to call:
  //      patchList({ name: "foo"})
  //      patchTask({ title: "foo", description: "bar"})
  //      setTaskParent(taskId, parentTaskIdOrNull)
  //
  //      The reason being that it's too tempting for the UI code to just modify
  //      the existing list/task, and the parent/children won't be kept up-to-date.
  //
  //      Consider also having a version field and, for any of these patch/set methods,
  //      you have to pass in what you believe to be the current version number of the
  //      item you're changing. If that doesn't match the version number that's in the
  //      DB then we don't make the change.

  function updateList(newList) {
    listsById[list.id] = newList
    // TODO: Update the value in firestore, preferably in a transaction
  }

  //   function _isSet(obj, propertyName) {
  //     return obj !== null && obj.hasOwnProperty(propertyName) && obj[propertyName] !== null
  //   }

  //   function patchTask(id, newValues) {
  //     const task = tasksById[id]
  //     if (task === null) {
  //       error(`BackendStore.patchTask: Cannot find task with id ${id}`)
  //     }

  //     const propertyNames = ['title', 'description']
  //     propertyNames.forEach((propertyName) => {
  //       if (_isSet(newValues, propertyName)) {
  //         task[propertyName] = newValues[propertyName]
  //       }
  //     })
  //     // TODO: Update the value in firestore, preferably in a transaction
  //   }

  //   function setListForTask(taskId, newListId) {
  //     const task = tasksById[id]
  //     if (task === null) {
  //       error(`BackendStore.setListForTask: Cannot find task with id ${id}`)
  //     }

  //   }

  function updateTask(newTask) {
    const taskId = newTask.id
    const oldTask = tasksById[taskId]

    if (oldTask !== null) {
      // Check to see if its list has changed
      if (oldTask.listId !== newTask.listId) {
        console.log(
          `BackendStore.updateTask: Changing list from ${oldTask.listId} to ${newTask.listId}`,
        )
        const newList = listsById[newTask.listId]
        if (newList !== null) {
          console.log('Before, newList had ', JSON.stringify(newList.taskIds))
          newList.taskIds.unshift(taskId)
          // TODO: Update the value in firestore, preferably in a transaction
          console.log('After, newList has', JSON.stringify(newList.taskIds))

          const oldList = listsById[oldTask.listId]
          if (oldList !== null) {
            console.log('Before, oldList had ', JSON.stringify(oldList.taskIds))
            oldList.taskIds = oldList.taskIds.filter((otherTaskId) => otherTaskId !== taskId)
            // TODO: Update the value in firestore, preferably in a transaction
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
        const oldParentTask = tasksById[oldTask.parentTaskId]
        oldParentTask.childTaskIds = oldParentTask.childTaskIds.filter(
          (otherTaskId) => otherTaskId !== taskId,
        )
        // TODO: Update the value in firestore, preferably in a transaction

        const newParentTask = tasksById[newTask.parentTaskId]
        newParentTask.childTaskIds.unshift(taskId)
        // TODO: Update the value in firestore, preferably in a transaction
      }

      // TODO: check to see if children have changed (not supported by UI yet)
    } else {
      console.warn("BackendStore.updateTask: Didn't find an existing task for", taskId, newTask)
    }

    tasksById[newTask.id] = newTask
    // TODO: Update the value in firestore, preferably in a transaction
  }

  function increment() {
    count.value++
  }

  // TODO: Can I combine the return with the consts?
  return {
    count,
    listsById,
    tasksById,
    name,
    doubleCount,
    updateList,
    updateTask,
    childTasksForTask,
    parentTaskForTask,
    increment,
  }
})
/*
const backend = {
  _isLoaded: false,
  _data: { lists: {}, tasks: {} }, // copy(defaultData),
  _callbacks: {},
  _fireCallbacks(entityType, modificationType, oldValue, newValue) {
    Object.entries(this._callbacks).forEach((callback) => {
      callback(entityType, modificationType, oldValue, newValue)
    })
  },

  async getLists() {
    await untilLoaded()
    return this._data.lists
    // return copy(this._data.lists)
  },
  async getList(id) {
    await untilLoaded()
    return this._data.lists[id]
    // const list = this._data.lists[id]
    // return list ? copy(list) : null
  },
  addList(newList) {
    const id = generateUUID()
    this._data.lists[id] = copy(newList)
    console.log('Added new list', newList)
    this._fireCallbacks('LIST', 'A', null, copy(newList))
  },
  updateList(updatedList) {
    const originalList = this._data.lists[updatedList.id]

    if (originalList === null) {
      throw ("Can't update list because it doesn't exist", updatedList)
    }

    this._data.lists[updatedList.id] = copy(updatedList)
    console.log('Updated list', updatedList)
    this._fireCallbacks('LIST', 'M', copy(originalList), copy(this._data.lists[updatedList.id]))
  },
  deleteList(id) {
    const originalList = this._data.lists[id]
    delete this._data.lists
    console.log('Deleted list', id, originalList)
    this._fireCallbacks('LIST', 'D', copy(originalList), null)
  },
  async getAndWatchLists(containerObject) {
    return await getAndWatchCollection(listsRef, containerObject)
  },
  async getAndWatchTasks(containerObject) {
    return await getAndWatchCollection(tasksRef, containerObject)
  },

  getLiveTasks(containerObject, propertyName) {
    containerObject[propertyName] = this._data.tasks
  },
  getLiveLists(containerObject, propertyName) {
    containerObject[propertyName] = this._data.lists
  },
  async getTasks() {
    await untilLoaded()
    return this._data.tasks
    // return copy(this._data.tasks)
  },
  async getTask(id) {
    await untilLoaded()
    return this._data.tasks[id]
    // const task = this._data.tasks[id]
    // return task ? copy(task) : null
  },
  addTask(newTask) {
    const id = generateUUID()
    this._data.tasks[id] = copy(newTask)
    console.log('Added new task', newTask)
    this._fireCallbacks('TASK', 'A', null, copy(newTask))
  },
  updateTask(updatedTask) {
    const originalTask = this._data.tasks[updatedTask.id]

    if (originalTask === null) {
      throw ("Can't update task because it doesn't exist", updatedTask)
    }

    this._data.tasks[updatedTask.id] = copy(updatedTask)
    console.log('Updated task', updatedTask)
    this._fireCallbacks('TASK', 'M', copy(originalTask), copy(this._data.tasks[updatedTask.id]))
  },
  deleteTask(id) {
    const originalTask = this._data.tasks[id]
    delete this._data.tasks
    console.log('Deleted task', id, originalTask)
    this._fireCallbacks('TASK', 'D', copy(originalTask), null)
  },
  // Callback has 4 params: entityType, modificationType, oldValue, newValue
  startWatching(callback) {
    const callbackId = generateUUID()
    this._callbacks[callbackId] = callback
    return callbackId
  },
}

async function getAndWatchCollection(collectionRef, containerObject) {
  const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const item = { id: change.doc.id, ...change.doc.data() }

      if (change.type === 'added') {
        console.log(`Firestore says: added document`, item.id, item)
        containerObject[item.id] = item
      }

      if (change.type === 'modified') {
        console.log('Firestore says: modified document', item.id, item)
        containerObject[item.id] = item
        // We shouldn't need to worry about updating child and parent IDs - they should also be saved in the DB.
      }

      if (change.type === 'removed') {
        console.log('Firestore says: deleted document', item.id, item)
        delete containerObject[item.id]
      }
    })
  })

  return unsubscribe
  //onUnmounted(() => {
  //  unsubscribe() // stop listening when component is destroyed
  //})
}

async function loadInitialSnapshot(collectionRef, containerObject) {
  console.log('Backend: Called loadInitialSnapshot for ', collectionRef)
  const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
    console.log('Backend: Got onSnapshot callback for ', collectionRef)
    snapshot.docChanges().forEach((change) => {
      const itemData = { id: change.doc.id, ...change.doc.data() }

      if (change.type === 'added') {
        console.log('Firestore says: added document', itemData.id, itemData)
        containerObject[itemData.id] = itemData
      }

      if (change.type === 'modified') {
        console.log('Firestore says: modified document', itemData.id, itemData)
        containerObject[itemData.id] = itemData
        // We shouldn't need to worry about updating child and parent IDs - they should also be saved in the DB.
      }

      if (change.type === 'removed') {
        console.log('Firestore says: deleted document', itemData.id, itemData)
        delete containerObject[itemData.id]
      }
    })
  })

  //onUnmounted(() => {
  //  unsubscribe() // stop listening when component is destroyed
  //})
}

await loadInitialSnapshot(tasksRef, backend._data.tasks)
await loadInitialSnapshot(listsRef, backend._data.lists)
backend._isLoaded = true

function copy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Definitely not secure! Never trust a UUID generated on the client!
function generateUUID() {
  // Public Domain/MIT
  var d = new Date().getTime() //Timestamp
  var d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0 //Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0
      d = Math.floor(d / 16)
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0
      d2 = Math.floor(d2 / 16)
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function until(conditionFunction) {
  const poll = (resolve) => {
    if (conditionFunction()) {
      console.log('Backend: Until: Condition function was successful. Will resolve.')
      resolve()
    } else {
      console.log('Backend: Until: Condition function was NOT successful. Will delay...')
      setTimeout((_) => poll(resolve), 100)
    }
  }

  return new Promise(poll)
}

function untilLoaded() {
  return until(() => backend._isLoaded)
}

console.log('###### Initialised backend.js #######', new Date().toISOString())

export default backend
*/
