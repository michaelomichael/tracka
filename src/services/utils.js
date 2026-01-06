import { getAuth, onAuthStateChanged } from 'firebase/auth'

// Asserts that there is a single match on the given array after filtering
// it using the given predicate.
export const single = (arr, predicate, options) => {
  if (arr === null) {
    throw 'single: Array is null'
  }

  if (arr.length === 0) {
    throw 'single: Before filtering, array has no entries'
  }

  const result = arr.filter(predicate)

  if (result.length === 1) {
    return result[0]
  } else if (result.length === 0) {
    throw 'single: After filtering, array has no entries'
  } else {
    const msg = `single: After filtering, array has multiple (${result.length}) entries`
    console.error(msg, result)
    if (options?.failOnMultipleMatches !== false) {
      throw msg
    } else {
      return result[0]
    }
  }
}

export const copy = (anything) => {
  return JSON.parse(JSON.stringify(anything))
}

export const stringToHslColour = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Convert hash to [0–360] for hue
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 30%)`
}

// Need a hack because getAuth().currentUser will return null if the
// firebase library hasn't finished loading.
// See https://youtu.be/xceR7mrrXsA?si=46NeFC9e7a5vUiXy&t=433
// Note that the onAuthStateChanged() callback fires immediately if the
// user is already logged in, so it's fine to call it lots of times in
// quick succession.
export function getCurrentUserOnceFirebaseHasLoaded() {
  return new Promise((resolve) => {
    const removeListener = onAuthStateChanged(getAuth(), (user) => {
      removeListener()
      resolve(user)
    })
  })
}

export function timestampNow() {
  return new Date().toISOString()
}

/**
 * Returns the number of days between now (or the optionalReferenceDate, if it is provided) and the given targetDate.
 * It's an approximation - we're not being super fussy.
 *
 * If the targetDate is in the past, we'll return a negative number.
 *
 * @param {*} targetDate Can be a date string (yyyy-mm-dd), a timestamp string (yyyy-mm-ddThh:mm:ss.SSSZ), or a Date object; all UTC.
 * @param {*} optionalReferenceDate Date object, defaults to current date/time.
 */
export function numDaysUntil(targetDate, optionalReferenceDate) {
  const referenceDate = optionalReferenceDate ?? new Date()

  const referenceUnixTimeAtMidnight = new Date(new Date(referenceDate).setUTCHours(0, 0, 0, 0))
  let targetUnixTimeAtMidnight
  if (typeof targetDate === 'string') {
    if (!targetDate.match(/^\d{4}-\d{2}-\d{2}/)) {
      throw `[numDaysUntil] Invalid targetDate string value '${targetDate}'`
    }
    targetUnixTimeAtMidnight = Date.parse(targetDate)
  } else if (targetDate instanceof Date) {
    targetUnixTimeAtMidnight = new Date(new Date(targetDate).setUTCHours(0, 0, 0, 0))
  } else {
    throw `[numDaysUntil] The targetDate provided ('${targetDate}', ${typeof targetDate}) is invalid`
  }

  const NUM_MILLIS_PER_DAY = 1000 * 60 * 60 * 24
  return Math.floor((targetUnixTimeAtMidnight - referenceUnixTimeAtMidnight) / NUM_MILLIS_PER_DAY)
}

export function taskDueByDescription(task) {
  if (task?.dueByTimestamp == null) {
    return null
  }

  const dueDate = new Date(Date.parse(task.dueByTimestamp))
  const daysUntil = numDaysUntil(dueDate)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  if (daysUntil === 0) {
    return 'Due today'
  } else if (daysUntil === 1) {
    return 'Due tomorrow'
  } else if (daysUntil >= 365) {
    return `Due on ${dueDate.getDate()} ${months[dueDate.getMonth()]} ${dueDate.getFullYear()}`
  } else if (daysUntil > 20) {
    return `Due on ${dueDate.getDate()} ${months[dueDate.getMonth()]}`
  } else if (daysUntil > 1) {
    return `Due in ${daysUntil} days`
  } else if (daysUntil === -1) {
    return 'Due yesterday'
  } else {
    return `Overdue by ${-daysUntil} days`
  }
}

/**
 * Convert the given array into a map, using the array items' id property.
 *
 * @param {*} arr Any array of objects, provided each object includes an 'id' property.
 * @returns A map of id-to-item
 */
export function associatedById(arr) {
  return arr.reduce((result, item) => {
    result[item.id] = item
    return result
  }, {})
}

/**
 * @param {*} value
 * @returns `true` if value is null, undefined, empty array, or ""
 */
export function isEmpty(value) {
  const isArray = Array.isArray(value)
  const valueType = typeof value

  if (value == null || (isArray && value.length === 0) || value === '') {
    return true
  } else if (isArray || valueType === 'string') {
    return false
  } else {
    let valueDescription = value
    let isJsonDescription = false
    try {
      valueDescription = JSON.stringify(value)
      isJsonDescription = true
    } catch (e) {}
    throw `[utils.isEmpty] Parameter with type '${valueType}' and ${isJsonDescription ? 'JSON ' : ''}value '${valueDescription}' is not an acceptable input to this function. Expected null, undefined, an array, or a string`
  }
}

/**
 * Similar to isEmpty() but also checks for strings containing only whitespace (incl. line terminators).
 *
 * @param {*} value
 * @returns `true` if value is null, undefined, empty array, "", or a string containing only whitespace
 */
export function isBlank(value) {
  return isEmpty(value) || (typeof value === 'string' && value.trim() === '')
}

export function taskDueByPanicIndex(task) {
  if (task?.dueByTimestamp == null) {
    return 0
  }

  console.log('[taskDueByPanicIndex] Task is', task)
  const numDays = numDaysUntil(task.dueByTimestamp)

  if (numDays > 14) {
    return 0
  } else if (numDays > 7) {
    return 1
  } else if (numDays > 1) {
    return 2
  } else if (numDays > 0) {
    return 3
  } else {
    return 4
  }
}

export function formatDateForFilename(date) {
  if (date == null) {
    date = new Date()
  }

  const pad = (n) => String(n).padStart(2, '0')

  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  const ss = pad(date.getSeconds())

  return `${yyyy}-${mm}-${dd} ${hh}.${min}.${ss}`
}
