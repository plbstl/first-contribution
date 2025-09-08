/**
 * Unit tests for the `pull_request` and `pull_request_target` events.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import * as main from '../src/main.ts'
import {
  create_comment_spy,
  created_comment_url,
  general_assertions,
  get_action_inputs_spy,
  get_fc_event_spy,
  get_input_spy_mock,
  is_first_time_contributor_spy,
  pr_closed_msg,
  pr_labels,
  pr_merged_msg,
  pr_opened_msg,
  was_the_first_contribution_spy
} from './helpers.ts'
import {
  github_context_mock,
  octokit_createComment_mock,
  octokit_listForRepo_mock,
  reset_mock_github_context
} from './setup.ts'

describe('pull_request', () => {
  beforeEach(() => {
    reset_mock_github_context()
  })

  describe('.opened', () => {
    it('handles when a new pull request is opened', async () => {
      // The user's first contribution
      octokit_listForRepo_mock.mockResolvedValue({ data: [{ pull_request: {} }] })
      octokit_createComment_mock.mockResolvedValue({ data: { html_url: created_comment_url } })
      // Supported event
      github_context_mock.eventName = 'pull_request_target'
      github_context_mock.payload.action = 'opened'
      github_context_mock.payload.pull_request = { number: 4, user: { login: 'randy' } }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'pr', state: 'opened' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [pr_labels],
        msg: pr_opened_msg
      })
      general_assertions({ added_labels: true })
      expect(get_input_spy_mock).toHaveBeenCalledTimes(['token', 'labels', 'msg', 'contribution-mode'].length)
      // Assert that the correct function was used
      expect(is_first_time_contributor_spy).toHaveResolvedWith(true)
      expect(was_the_first_contribution_spy).not.toHaveBeenCalled()
    })
  })

  describe('.closed', () => {
    it('handles when a pull request is merged', async () => {
      // This was the user's first and only PR
      octokit_listForRepo_mock.mockResolvedValue({
        data: [{ number: 4, pull_request: {}, created_at: '2025-01-01T12:00:00Z' }]
      })
      octokit_createComment_mock.mockResolvedValue({ data: { html_url: created_comment_url } })
      // Supported event
      github_context_mock.eventName = 'pull_request_target'
      github_context_mock.payload.action = 'closed'
      github_context_mock.payload.pull_request = { number: 4, user: { login: 'randy' }, merged: true }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'pr', state: 'merged' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [pr_labels],
        msg: pr_merged_msg
      })
      general_assertions({ added_labels: false })
      // Assert that the correct function was used
      expect(was_the_first_contribution_spy).toHaveResolvedWith(true)
      expect(is_first_time_contributor_spy).not.toHaveBeenCalled()
    })

    it('handles when a pull request is closed WITHOUT being merged', async () => {
      // This was the user's first and only PR
      octokit_listForRepo_mock.mockResolvedValue({
        data: [{ number: 4, pull_request: {}, created_at: '2025-01-01T12:00:00Z' }]
      })
      octokit_createComment_mock.mockResolvedValue({ data: { html_url: created_comment_url } })
      // Supported event
      github_context_mock.eventName = 'pull_request_target'
      github_context_mock.payload.action = 'closed'
      github_context_mock.payload.pull_request = { number: 4, user: { login: 'randy' }, merged: false }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'pr', state: 'closed' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [pr_labels],
        msg: pr_closed_msg
      })
      general_assertions({ added_labels: false })
      // Assert that the correct function was used
      expect(was_the_first_contribution_spy).toHaveResolvedWith(true)
      expect(is_first_time_contributor_spy).not.toHaveBeenCalled()
    })

    it('comments when the FIRST of two PRs is closed', async () => {
      // SCENARIO: User opens PR #4, then PR #5. Then PR #4 is closed.
      octokit_listForRepo_mock.mockResolvedValue({
        data: [
          { number: 4, pull_request: {}, created_at: '2025-01-01T10:00:00Z' }, // First PR
          { number: 5, pull_request: {}, created_at: '2025-01-01T11:00:00Z' } // Second PR
        ]
      })
      octokit_createComment_mock.mockResolvedValue({ data: { html_url: created_comment_url } })
      github_context_mock.eventName = 'pull_request_target'
      github_context_mock.payload.action = 'closed'
      // The event is for PR #4, which is the historically first one
      github_context_mock.payload.pull_request = { number: 4, user: { login: 'randy' }, merged: true }

      await main.run()

      general_assertions({ added_labels: false })
      // The action should proceed and create a comment
      expect(create_comment_spy).toHaveBeenCalled()
      expect(was_the_first_contribution_spy).toHaveResolvedWith(true)
    })

    it('does NOT comment when a NON-FIRST PR is closed', async () => {
      // SCENARIO: User opens PR #4, then PR #5. Then PR #5 is closed.
      octokit_listForRepo_mock.mockResolvedValue({
        data: [
          { number: 4, pull_request: {}, created_at: '2025-01-01T10:00:00Z' }, // First PR
          { number: 5, pull_request: {}, created_at: '2025-01-01T11:00:00Z' } // Second PR
        ]
      })
      github_context_mock.eventName = 'pull_request_target'
      github_context_mock.payload.action = 'closed'
      // The event is for PR #5, which is NOT the first one
      github_context_mock.payload.pull_request = { number: 5, user: { login: 'randy' }, merged: true }

      await main.run()

      general_assertions()
      // The action should exit and NOT create a comment
      expect(create_comment_spy).not.toHaveBeenCalled()
      expect(was_the_first_contribution_spy).toHaveResolvedWith(false)
    })
  })
})
