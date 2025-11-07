import { describe, expect, it } from 'vitest'
import { isBlank, isEmpty, numDaysUntil } from '../../src/services/utils'

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

describe('numDaysUntil', () => {
  const todayEarlyReferenceDate = new Date(Date.parse('2024-07-09T00:05:00Z'))
  const todayLateReferenceDate = new Date(Date.parse('2024-07-09T23:55:00Z'))

  describe('with invalid inputs', () => {
    it('should throw if input is blank string', () => {
      expect(() => numDaysUntil('   ')).toThrow()
    })

    it.each([
      ['number', 12345678],
      ['boolean', true],
      ['object', {}],
    ])('should throw if input is a %s', (_, targetDate) => {
      expect(() => numDaysUntil(targetDate)).toThrow()
    })
  })

  describe('with no reference date passed', () => {
    it("should return 0 when target is today's date", () => {
      expect(numDaysUntil(new Date().toISOString())).toBe(0)
    })
  })

  describe.each([
    ['early', todayEarlyReferenceDate],
    ['late', todayLateReferenceDate],
  ])('with %s reference date', (_, todayReferenceDate) => {
    describe.each([
      [0, 'same', '2024-07-09'],
      [-1, 'previous', '2024-07-08'],
      [-2, 'previous-previous', '2024-07-07'],
      [1, 'next', '2024-07-10'],
      [2, 'next', '2024-07-11'],
    ])(
      'should return %i if targetDate is on the %s calendar days as today',
      (expectedResult, _, targetDateString) => {
        it('when targetDate is a yyyy-mm-dd string', () => {
          expect(numDaysUntil(targetDateString, todayReferenceDate)).toBe(expectedResult)
        })

        it('when targetDate is a Date object', () => {
          const targetDateObject = new Date(Date.parse(targetDateString))
          expect(numDaysUntil(targetDateObject, todayReferenceDate)).toBe(expectedResult)
        })
      },
    )
  })
})
