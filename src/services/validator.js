const fail = (obj, propertyName, message) => {
  throw `Validation error: property '${propertyName}' ${message} for object <${obj}>`
}

const shouldBeType = (obj, propertyName, expectedTypeName) => {
  const typeName = typeof obj[propertyName]
  if (typeName !== expectedTypeName) {
    fail(obj, propertyName, `should be of type ${expectedTypeName} but was ${typeName}`)
  }
}

const shouldBeString = (obj, propertyName) => {
  shouldBeType(obj, propertyName, 'string')
}
const shouldNotBeEmptyString = (obj, propertyName) => {
  shouldBeString(obj, propertyName)
  if (obj[propertyName] === '') {
    fail(obj, propertyName, `should not be empty string, but was '${obj[propertyName]}'`)
  }
}
const shouldBePositiveInteger = (obj, propertyName) => {
  shouldBeType(obj, propertyName, 'number')

  if (obj[propertyName] < 0) {
    fail(obj, propertyName, 'should be >= 0')
  }
}

const shouldBeArray = (obj, propertyName) => {
  if (!Array.isArray(obj[propertyName])) {
    fail(obj, propertyName, 'should be an array')
  }
}
const shouldNotContainDuplicates = (obj, propertyName) => {
  const uniqueItems = new Set(obj[propertyName])

  if (uniqueItems.size !== obj[propertyName].length) {
    fail(obj, propertyName, 'contains duplicates')
  }
}
const shouldBeEnumString = (obj, propertyName, ...allowedValues) => {
  shouldBeString(obj, propertyName)
  if (allowedValues.indexOf(obj[propertyName]) < 0) {
    fail(obj, propertyName, `has an invalid enum value '${obj[propertyName]}'`)
  }
}

export const validateBoard = (board, allListsById) => {
  console.log('Validating board: ', board)

  shouldBeArray(board, 'listIds')
  shouldNotContainDuplicates(board, 'listIds')

  board.listIds.forEach((listId) => {
    if (allListsById[listId] == null) {
      fail(obj, 'listIds', `contains unknown list id '${listId}'`)
    }
  })

  const referencedListIds = new Set(board.listIds)
  Object.keys(allListsById).forEach((listId) => {
    if (!referencedListIds.has(listId)) {
      fail(board, 'listIds', `is missing list id '${listId}'`)
    }
  })
}

export const validateList = (list, allTasksById) => {
  console.log('Validating list: ', list)
  /*
    id?
    name
    order
    taskIds
    specialCategory
    */
  shouldBeString(list, 'name')
  shouldNotBeEmptyString(list, 'name')

  shouldBePositiveInteger(list, 'order')

  shouldBeArray(list, 'taskIds')
  shouldNotContainDuplicates(list, 'taskIds')

  if (list.specialCategory != null) {
    shouldBeEnumString(list, 'specialCategory', 'DONE', 'TODAY', 'BACKLOG')
  }

  list.taskIds.forEach((taskId) => {
    if (allTasksById[taskId] == null) {
      fail(obj, 'taskIds', `contains unknown task id '${taskId}'`)
    }
  })
}
