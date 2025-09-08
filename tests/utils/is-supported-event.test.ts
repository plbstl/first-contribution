/**
 * Unit tests for the action's `is_supported_event` util.
 */

import { describe, expect, it } from 'vitest'
import { is_supported_event } from '~src/utils/index.ts'

describe('is_supported_event()', () => {
  it('determines whether the triggered event is supported or not', () => {
    expect(is_supported_event('issues', 'opened')).toBe(true)
    expect(is_supported_event('pull_request', 'closed')).toBe(true)
    expect(is_supported_event('pull_request_target', 'opened')).toBe(true)

    expect(is_supported_event('discussion', 'created')).toBe(false)
    expect(is_supported_event('issue_comment', 'created')).toBe(false)
    expect(is_supported_event('issues', 'unassigned')).toBe(false)
    expect(is_supported_event('pull_request', 'reopened')).toBe(false)
    expect(is_supported_event('pull_request_review_comment', 'deleted')).toBe(false)
    expect(is_supported_event('pull_request_target', 'labeled')).toBe(false)
  })
})
