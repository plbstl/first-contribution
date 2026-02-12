/**
 * Unit tests for the action's `get_fc_event` util.
 */

import type { context } from '@actions/github'
import { describe, expect, it } from 'vitest'
import { get_fc_event } from '~src/utils/index.ts'

type WebhookPayload = (typeof context)['payload']

describe('get_fc_event()', () => {
  it('identifies an opened issue', () => {
    const payload = { issue: { title: 'New bug' } } as unknown as WebhookPayload
    const event = get_fc_event('opened', payload)
    expect(event).toEqual({ name: 'issue', state: 'opened' })
  })

  it('identifies an opened pull request', () => {
    const payload = { pull_request: { title: 'New feature' } } as unknown as WebhookPayload
    const event = get_fc_event('opened', payload)
    expect(event).toEqual({ name: 'pr', state: 'opened' })
  })

  it('identifies a completed issue', () => {
    const payload = { issue: { title: 'Old bug', state_reason: 'completed' } } as unknown as WebhookPayload
    const event = get_fc_event('closed', payload)
    expect(event).toEqual({ name: 'issue', state: 'completed' })
  })

  it('identifies a not-planned issue', () => {
    const payload = { issue: { title: 'Wont fix', state_reason: 'not_planned' } } as unknown as WebhookPayload
    const event = get_fc_event('closed', payload)
    expect(event).toEqual({ name: 'issue', state: 'not-planned' })
  })

  it('identifies a merged pull request', () => {
    const payload = { pull_request: { title: 'Old feature', merged: true } } as unknown as WebhookPayload
    const event = get_fc_event('closed', payload)
    expect(event).toEqual({ name: 'pr', state: 'merged' })
  })

  it('identifies a closed (unmerged) pull request', () => {
    const payload = { pull_request: { title: 'Rejected feature', merged: false } } as unknown as WebhookPayload
    const event = get_fc_event('closed', payload)
    expect(event).toEqual({ name: 'pr', state: 'closed' })
  })
})
