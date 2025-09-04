const backend = {
  _data: {
    lists: {
      1000: {
        id: '1000',
        name: 'Backlog',
        taskIds: ['1', '2'],
      },
      2000: {
        id: '2000',
        name: 'Done',
        taskIds: ['3'],
      },
    },
    tasks: {
      1: {
        id: '1',
        title: 'Default task #1',
        description: 'Description of default task #1',
        listId: '1000',
      },
      2: {
        id: '2',
        title: 'Default task #2',
        description: 'Description of default task #2',
        listId: '1000',
      },
      3: {
        id: '3',
        title: 'Default task #3',
        description: 'Description of default task #3',
        listId: '2000',
      },
    },
  },
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
