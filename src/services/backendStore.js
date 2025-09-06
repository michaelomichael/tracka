import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'
import credentials from '@/../firebaseCredentials.json'
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

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
export const firebaseApp = initializeApp(credentials)

// used for the firestore refs
const db = getFirestore(firebaseApp)

// here we can export reusable database references

const tasksRef = collection(db, 'tasks')
const listsRef = collection(db, 'lists')

export const useBackendStore = defineStore('backendStore', () => {
  const count = ref(0)
  const listsById = ref({}) // defaultData.lists)
  const tasksById = ref({}) // defaultData.tasks)
  const name = ref('eduardo')
  const doubleCount = computed(() => count.value * 2)
  //   const _data = reactive({ listsById: {}, tasksById: {} })
  //   const listsById = computed(() => listsById.value)
  //   const tasksById = computed(() => tasksById.value)
  let unsubscribeTasks = null
  let unsubscribeLists = null

  // Sync Firestore -> Pinia
  const init = () => {
    if (!unsubscribeTasks) {
      // avoid duplicate listeners
      unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
        const newTasksById = {}
        snapshot.docs.forEach((doc) => (newTasksById[doc.id] = { id: doc.id, ...doc.data() }))
        console.log(`BackendStore.onSnapshot: Got new tasks:`, JSON.stringify(newTasksById))
        tasksById.value = newTasksById
      })
    }
    if (!unsubscribeLists) {
      // avoid duplicate listeners
      unsubscribeLists = onSnapshot(listsRef, (snapshot) => {
        const newListsById = {}
        snapshot.docs.forEach((doc) => (newListsById[doc.id] = { id: doc.id, ...doc.data() }))
        console.log(`BackendStore.onSnapshot: Got new lists:`, JSON.stringify(newListsById))
        listsById.value = newListsById
      })
    }
  }
  function childTasksForTask(taskId) {
    const task = tasksById.value[taskId]
    return task === null
      ? null
      : task.childTaskIds
          .map((childTaskId) => tasksById.value[childTaskId])
          .filter((childTask) => childTask !== null)
  }
  function parentTaskForTask(taskId) {
    const task = tasksById.value[taskId]
    return task?.parentTaskId == null ? null : tasksById.value[task.parentTaskId]
  }

  function updateList(newList) {
    updateDoc(doc(db, 'lists', newList.id), newList)
    // listsById.value[list.id] = newList
  }

  function updateTask(newTask) {
    const taskId = newTask.id
    const oldTask = tasksById.value[taskId]

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

  function increment() {
    count.value++
  }

  // TODO: Can I combine the return with the consts?
  return {
    count,
    init,
    listsById,
    tasksById,
    name,
    doubleCount,
    updateList,
    updateTask,
    childTasksForTask,
    parentTaskForTask,
    increment,
    // listsById,
    // tasksById,
    // _data,
  }
})

// async function loadInitialSnapshotOld(collectionRef, containerObject) {
//   console.log('BackendStore.loadInitialSnapshot: Starting for ', collectionRef)
//   const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
//     console.log('BackendStore.loadInitialSnapshot: Got onSnapshot callback for ', collectionRef)
//     snapshot.docChanges().forEach((change) => {
//       const itemData = { id: change.doc.id, ...change.doc.data() }

//       if (change.type === 'added') {
//         console.log(
//           'BackendStore.loadInitialSnapshot: Firestore says: added document',
//           itemData.id,
//           itemData,
//         )
//         containerObject[itemData.id] = itemData
//       }

//       if (change.type === 'modified') {
//         console.log(
//           'BackendStore.loadInitialSnapshot: Firestore says: modified document',
//           itemData.id,
//           itemData,
//         )
//         containerObject[itemData.id] = itemData
//         // We shouldn't need to worry about updating child and parent IDs - they should also be saved in the DB.
//       }

//       if (change.type === 'removed') {
//         console.log(
//           'BackendStore.loadInitialSnapshot: Firestore says: deleted document',
//           itemData.id,
//           itemData,
//         )
//         delete containerObject[itemData.id]
//       }
//     })
//   })

//   console.log('BackendStore.loadInitialSnapshot: done')
//   //onUnmounted(() => {
//   //  unsubscribe() // stop listening when component is destroyed
//   //})
// }
