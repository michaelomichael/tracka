import { describe, expect, it } from 'vitest'
import { isBlank, isEmpty } from '../../src/services/utils'

describe('isEmpty', () => {
  it('should return true for undefined', () => {
    const result = isEmpty(undefined)
    expect(result).toBe(true)
  })

  it('should return true for null', () => {
    const result = isEmpty(null)
    expect(result).toBe(true)
  })

  it('should return true for empty array', () => {
    const result = isEmpty([])
    expect(result).toBe(true)
  })

  it('should return true for empty string', () => {
    const result = isEmpty('')
    expect(result).toBe(true)
  })

  it('should return false for populated array', () => {
    const result = isEmpty([null])
    expect(result).toBe(false)
  })

  it('should return false for blank string', () => {
    const result = isEmpty(' ')
    expect(result).toBe(false)
  })

  it('should return false for populated string', () => {
    const result = isEmpty('hello, world!')
    expect(result).toBe(false)
  })

  it('should throw for number', () => {
    expect(() => isEmpty(123)).toThrow()
  })

  it('should throw for boolean', () => {
    expect(() => isEmpty(true)).toThrow()
  })

  it('should throw for object', () => {
    expect(() => isEmpty({})).toThrow()
  })

  it('should throw for function', () => {
    expect(() => isEmpty(() => 'hi')).toThrow()
  })
})

describe('isBlank', () => {
  it('should return true for undefined', () => {
    const result = isBlank(undefined)
    expect(result).toBe(true)
  })

  it('should return true for null', () => {
    const result = isBlank(null)
    expect(result).toBe(true)
  })

  it('should return true for empty array', () => {
    const result = isBlank([])
    expect(result).toBe(true)
  })

  it('should return true for empty string', () => {
    const result = isBlank('')
    expect(result).toBe(true)
  })

  it('should return false for populated array', () => {
    const result = isBlank([null])
    expect(result).toBe(false)
  })

  it('should return true for blank string', () => {
    const result = isBlank('  \n ')
    expect(result).toBe(true)
  })

  it('should return false for populated string', () => {
    const result = isBlank('hello, world!')
    expect(result).toBe(false)
  })

  it('should throw for number', () => {
    expect(() => isBlank(123)).toThrow()
  })

  it('should throw for boolean', () => {
    expect(() => isBlank(true)).toThrow()
  })

  it('should throw for object', () => {
    expect(() => isBlank({})).toThrow()
  })

  it('should throw for function', () => {
    expect(() => isBlank(() => 'hi')).toThrow()
  })
})
