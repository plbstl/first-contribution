/**
 * Unit tests for the `issues` event.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import * as main from '../src/main.ts'
import {
  created_comment_url,
  general_assertions,
  get_action_inputs_spy,
  get_fc_event_spy,
  get_input_spy_mock,
  is_first_time_contributor_spy,
  issue_completed_msg,
  issue_labels,
  issue_not_planned_msg,
  issue_opened_msg,
  was_the_first_contribution_spy
} from './helpers.ts'
import {
  github_context_mock,
  octokit_createComment_mock,
  octokit_listForRepo_mock,
  reset_mock_github_context
} from './setup.ts'

describe('issues', () => {
  beforeEach(() => {
    reset_mock_github_context()
  })

  describe('.opened', () => {
    it('handles when a new issue is opened', async () => {
      // The user's first contribution
      octokit_listForRepo_mock.mockResolvedValue({ data: [{}] })
      octokit_createComment_mock.mockResolvedValue({ data: { html_url: created_comment_url } })
      // Supported event
      github_context_mock.eventName = 'issues'
      github_context_mock.payload.action = 'opened'
      github_context_mock.payload.issue = { number: 8, user: { login: 'ghosty' } }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'issue', state: 'opened' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [issue_labels],
        msg: issue_opened_msg
      })
      general_assertions({ added_labels: true })
      expect(get_input_spy_mock).toHaveBeenCalledTimes(['token', 'labels', 'msg', 'contribution-mode'].length)
      // Assert that the correct function was used
      expect(is_first_time_contributor_spy).toHaveResolvedWith(true)
      expect(was_the_first_contribution_spy).not.toHaveBeenCalled()
    })
  })

  describe('.closed', () => {
    it('handles when an issue is closed as completed', async () => {
      // This was the user's first and only issue
      octokit_listForRepo_mock.mockResolvedValue({
        data: [{ number: 8, created_at: '2025-01-01T12:00:00Z' }]
      })
      octokit_createComment_mock.mockResolvedValue({ data: { html_url: created_comment_url } })
      // Supported event
      github_context_mock.eventName = 'issues'
      github_context_mock.payload.action = 'closed'
      github_context_mock.payload.issue = { number: 8, user: { login: 'ghosty' }, state_reason: 'completed' }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'issue', state: 'completed' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [issue_labels],
        msg: issue_completed_msg
      })
      general_assertions({ added_labels: false })
      // Assert that the correct function was used
      expect(was_the_first_contribution_spy).toHaveResolvedWith(true)
      expect(is_first_time_contributor_spy).not.toHaveBeenCalled()
    })

    it('handles when an issue is closed as not planned', async () => {
      // This was the user's first and only issue
      octokit_listForRepo_mock.mockResolvedValue({
        data: [{ number: 8, created_at: '2025-01-01T12:00:00Z' }]
      })
      octokit_createComment_mock.mockResolvedValue({ data: { html_url: created_comment_url } })
      // Supported event
      github_context_mock.eventName = 'issues'
      github_context_mock.payload.action = 'closed'
      github_context_mock.payload.issue = { number: 8, user: { login: 'ghosty' }, state_reason: 'not_planned' }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'issue', state: 'not-planned' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [issue_labels],
        msg: issue_not_planned_msg
      })
      general_assertions({ added_labels: false })
      // Assert that the correct function was used
      expect(was_the_first_contribution_spy).toHaveResolvedWith(true)
      expect(is_first_time_contributor_spy).not.toHaveBeenCalled()
    })
  })
})
