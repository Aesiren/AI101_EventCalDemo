import { describe, expect, it } from 'vitest'
import { validateCreateEventInput } from '../../../server/utils/eventValidation'

function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Community Cookout',
    location: 'Base Pavilion',
    type: 'Social',
    description: 'A casual cookout open to all base members.',
    dateTime: '2026-09-01T18:00:00.000Z',
    ...overrides
  }
}

describe('validateCreateEventInput', () => {
  it('is valid when every field is present (TC-1.4-05, happy path)', () => {
    const result = validateCreateEventInput(baseBody())
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('blocks submission when name is empty (TC-1.4-01)', () => {
    const result = validateCreateEventInput(baseBody({ name: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('name is required')
  })

  it('blocks submission when location is empty (TC-1.4-02)', () => {
    const result = validateCreateEventInput(baseBody({ location: '  ' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('location is required')
  })

  it('blocks submission when type is not selected (TC-1.4-03)', () => {
    const result = validateCreateEventInput(baseBody({ type: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('type is required')
  })

  it('blocks submission when type is not one of the six fixed categories', () => {
    const result = validateCreateEventInput(baseBody({ type: 'Karaoke Night' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('type must be one of the fixed event categories')
  })

  it('blocks submission when description is empty (TC-1.4-04)', () => {
    const result = validateCreateEventInput(baseBody({ description: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('description is required')
  })

  it('blocks submission when dateTime is empty (TC-1.4-06)', () => {
    const result = validateCreateEventInput(baseBody({ dateTime: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('dateTime is required')
  })

  it('collects every violation at once rather than stopping at the first', () => {
    const result = validateCreateEventInput(baseBody({ name: '', location: '', dateTime: '' }))
    expect(result.errors).toHaveLength(3)
  })

  it('rejects non-string fields', () => {
    const result = validateCreateEventInput(baseBody({ name: 42 }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('name is required')
  })
})
