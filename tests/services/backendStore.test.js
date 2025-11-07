import { describe, it, vi, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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
import { useBackendStore } from '../../src/services/backendStore'
import { getAuth } from 'firebase/auth'
import { timestampNow } from '../../src/services/utils'

const defaults = {
  newDocId: '1234',
  newDocRef: { id: '1234' },
  userId: '9999',
  auth: { currentUser: { uid: '9999' } },
  timestamp: '2025-11-07T16:11:16.458Z',
}

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => defaults.newDocRef),
  setDoc: vi.fn(),
  collection: vi.fn(),
  updateDoc: vi.fn(),
  getFirestore: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => defaults.auth),
}))

// Mock the module
vi.mock('../../src/services/utils', async () => {
  // Import the original module
  const actual = await vi.importActual('../../src/services/utils')

  return {
    ...actual,
    //add: vi.fn(() => 42), // override only 'add'
    timestampNow: vi.fn(() => defaults.timestamp),
  }
})

// vi.mock(
//   import('../../src/services/utils', async (importOriginal) => {
//     const original = await importOriginal()
//     return {
//       ...original,
//       timestampNow: vi.fn(() => 'hi'), //defaults.timestamp),
//     }
//   }),
// )

let underTest

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  underTest = useBackendStore()
  underTest._data.listsById = {}
  underTest._data.tasksById = {}
})

const givenThatTaskExistsWith = (taskProperties) => {
  const id = taskProperties.id ?? `task-${Math.random()}`

  underTest._data.tasksById[id] = {
    id,
    title: `Task ${id}`,
    listId: null,
    parentTaskId: null,
    childTaskIds: [],
    isDone: false,
    doneTimestamp: null,
    ownerId: defaults.userId,
    createdTimestamp: defaults.timestamp,
    modifiedTimestamp: defaults.timestamp,
    ...taskProperties,
  }
}

const givenThatListExistsWith = (listProperties) => {
  const id = listProperties.id ?? `list-${Math.random()}`

  underTest._data.listsById[id] = {
    id,
    name: `Random ${id}`,
    order: Math.floor(Math.random() * 1000000000),
    taskIds: [],
    specialCategory: null,
    ownerId: defaults.userId,
    createdTimestamp: defaults.timestamp,
    modifiedTimestamp: defaults.timestamp,
    ...listProperties,
  }
}

describe('addList', () => {
  it('throws when name is missing', async () => {
    await expect(async () => await underTest.addList({})).rejects.toThrow()
  })

  it('throws when id is provided', async () => {
    await expect(
      async () => await underTest.addList({ id: 'blah', name: 'Test list' }),
    ).rejects.toThrow()
  })

  it('adds list with minimal fields to firestore', async () => {
    const result = await underTest.addList({ name: 'Test list' })
    expect(setDoc).toHaveBeenCalledExactlyOnceWith(defaults.newDocRef, {
      id: defaults.newDocId,
      name: 'Test list',
      taskIds: [],
      order: 0,
      ownerId: defaults.userId,
      specialCategory: null,
      createdTimestamp: defaults.timestamp,
      modifiedTimestamp: defaults.timestamp,
    })
  })

  it('adds list with fully populated fields to firestore', async () => {
    givenThatTaskExistsWith({ id: '1' })
    const result = await underTest.addList({
      name: 'Test list',
      taskIds: ['1'],
      order: 99,
      specialCategory: 'DONE',
      createdTimestamp: 'fake-timestamp',
      modifiedTimestamp: 'fake-timestamp',
    })

    expect(setDoc).toHaveBeenCalledExactlyOnceWith(defaults.newDocRef, {
      id: defaults.newDocId,
      name: 'Test list',
      taskIds: ['1'],
      order: 99,
      ownerId: defaults.userId,
      specialCategory: 'DONE',
      createdTimestamp: defaults.timestamp,
      modifiedTimestamp: defaults.timestamp,
    })
  })

  it('adds list to the local cache', async () => {
    const result = await underTest.addList({
      name: 'Test list',
    })

    expect(underTest.getList(result.id, true)).toMatchObject({
      id: defaults.newDocId,
      name: 'Test list',
      taskIds: [],
      order: 0,
      ownerId: defaults.userId,
      specialCategory: null,
      createdTimestamp: defaults.timestamp,
      modifiedTimestamp: defaults.timestamp,
    })
  })

  it('chooses correct value for order', async () => {
    givenThatListExistsWith({ order: 7 })
    givenThatListExistsWith({ order: 2 })

    const result = await underTest.addList({ name: 'Test list 3' })

    expect(result?.order).toBe(8)
  })
})
