import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore'
import credentials from '@/../firebaseCredentials.json'

export const firebaseApp = initializeApp(credentials)

// used for the firestore refs
const db = getFirestore(firebaseApp)

// here we can export reusable database references

const tasksRef = collection(db, 'tasks')
const listsRef = collection(db, 'lists')

const defaultData = {
  lists: {
    1: {
      id: '1',
      name: 'Done',
      taskIds: ['3000'],
    },
    2: {
      id: '2',
      name: 'Backlog',
      taskIds: ['1000', '2000'],
    },
  },
  tasks: {
    1000: {
      id: '1000',
      title: 'Default task #1',
      description: 'Description of default task #1',
      listId: '1000',
      parentTaskId: null,
      childTaskIds: [],
    },
    2000: {
      id: '2000',
      title: 'Default task #2',
      description: 'Description of default task #2',
      listId: '1',
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

async function repopulateCollection(ref, typeName, items) {
  const snapshot = await getDocs(ref)
  const deletions = snapshot.docs.map((d) => deleteDoc(doc(db, typeName, d.id)))
  await Promise.all(deletions)

  const writes = items.map((item) => setDoc(doc(db, typeName, item.id), item))
  await Promise.all(writes)
}

export async function resetDb() {
  repopulateCollection(tasksRef, 'tasks', Object.values(defaultData.tasks))
  repopulateCollection(listsRef, 'lists', Object.values(defaultData.lists))
}

//await resetDb()

const backend = {
  _data: { lists: {}, tasks: {} }, // copy(defaultData),
  _callbacks: {},
  _fireCallbacks(entityType, modificationType, oldValue, newValue) {
    Object.entries(this._callbacks).forEach((callback) => {
      callback(entityType, modificationType, oldValue, newValue)
    })
  },

  getLists() {
    return copy(this._data.lists)
  },
  getList(id) {
    const list = this._data.lists[id]
    return list ? copy(list) : null
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
  getTasks() {
    return copy(this._data.tasks)
  },
  getTask(id) {
    const task = this._data.tasks[id]
    return task ? copy(task) : null
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

async function loadInitialTasksSnapshot() {
  const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const taskData = { id: change.doc.id, ...change.doc.data() }

      if (change.type === 'added') {
        console.log('Firestore says: added document', taskData.id, taskData)
        backend._data.tasks[taskData.id] = taskData
      }

      if (change.type === 'modified') {
        console.log('Firestore says: modified document', taskData.id, taskData)
        backend._data.tasks[taskData.id] = taskData
        // We shouldn't need to worry about updating child and parent IDs - they should also be saved in the DB.
      }

      if (change.type === 'removed') {
        console.log('Firestore says: deleted document', taskData.id, taskData)
        delete backend._data.tasks[taskData.id]
      }
    })
  })

  //onUnmounted(() => {
  //  unsubscribe() // stop listening when component is destroyed
  //})
}

await loadInitialTasksSnapshot()

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

export default backend
