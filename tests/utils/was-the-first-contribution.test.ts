/**
 * Unit tests for the action's `was_the_first_contribution` util.
 */

import type { Issue, PullRequest } from '@octokit/webhooks-types'
import { describe, expect, it } from 'vitest'
import { was_the_first_contribution } from '~src/utils/index.ts'
import { octokit } from '~tests/helpers.ts'
import { octokit_listForRepo_mock } from '~tests/setup.ts'

describe('was_the_first_contribution()', () => {
  const default_opts = {
    creator: 'ghosty',
    owner: 'owner',
    repo: 'repo'
  }

  const first_pr = {
    number: 101,
    user: { login: 'ghosty' },
    pull_request: {},
    created_at: '2025-01-15T12:00:00Z'
  } as unknown as Issue | PullRequest

  const second_pr = {
    number: 105,
    user: { login: 'ghosty' },
    pull_request: {},
    created_at: '2025-02-20T12:00:00Z'
  } as unknown as Issue | PullRequest

  it('returns true if the closed PR is the first and only one', async () => {
    octokit_listForRepo_mock.mockResolvedValue({ data: [first_pr] })

    const result = await was_the_first_contribution(octokit, {
      ...default_opts,
      is_pull_request: true,
      issue_or_pull_request: first_pr
    })

    expect(result).toBe(true)
  })

  it('returns true if the closed PR is the first of several', async () => {
    // Return PRs out of order to test sorting
    octokit_listForRepo_mock.mockResolvedValue({ data: [second_pr, first_pr] })

    const result = await was_the_first_contribution(octokit, {
      ...default_opts,
      is_pull_request: true,
      issue_or_pull_request: first_pr
    })

    expect(result).toBe(true)
  })

  it('returns false if the closed PR is NOT the first', async () => {
    octokit_listForRepo_mock.mockResolvedValue({ data: [second_pr, first_pr] })

    const result = await was_the_first_contribution(octokit, {
      ...default_opts,
      is_pull_request: true,
      issue_or_pull_request: second_pr
    })

    expect(result).toBe(false)
  })

  it('correctly handles issues', async () => {
    const first_issue = { ...first_pr, pull_request: undefined } as unknown as Issue | PullRequest
    const second_issue = { ...second_pr, pull_request: undefined } as unknown as Issue | PullRequest
    octokit_listForRepo_mock.mockResolvedValue({ data: [second_issue, first_issue] })

    const result = await was_the_first_contribution(octokit, {
      ...default_opts,
      is_pull_request: false,
      issue_or_pull_request: first_issue
    })

    expect(result).toBe(true)
  })

  it('returns false if no contributions are found', async () => {
    octokit_listForRepo_mock.mockResolvedValue({ data: [] })

    const result = await was_the_first_contribution(octokit, {
      ...default_opts,
      is_pull_request: true,
      issue_or_pull_request: first_pr
    })

    expect(result).toBe(false)
  })
})
