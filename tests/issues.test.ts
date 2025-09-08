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
  issue_completed_msg,
  issue_labels,
  issue_not_planned_msg,
  issue_opened_msg
} from './helpers.ts'
import {
  mock_github_context,
  octokit_createComment_mock,
  octokit_listForRepo_mock,
  reset_mock_github_context
} from './setup.ts'

describe('issues', () => {
  beforeEach(() => {
    reset_mock_github_context()
  })

  describe('.opened', () => {
    // Mock requests
    octokit_listForRepo_mock.mockReturnValue({ data: [{}] })
    octokit_createComment_mock.mockReturnValue({ data: { html_url: created_comment_url } })

    it('handles when a new issue is opened', async () => {
      // Supported event
      mock_github_context.eventName = 'issues'
      mock_github_context.payload.action = 'opened'
      mock_github_context.payload.issue = { number: 8, user: { login: 'ghosty' } }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'issue', state: 'opened' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [issue_labels],
        msg: issue_opened_msg
      })

      general_assertions({ added_label: true })
    })
  })

  describe('.closed', () => {
    it('handles when an issue is closed as completed', async () => {
      // Supported event
      mock_github_context.eventName = 'issues'
      mock_github_context.payload.action = 'closed'
      mock_github_context.payload.issue = { number: 8, user: { login: 'ghosty' }, state_reason: 'completed' }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'issue', state: 'completed' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [issue_labels],
        msg: issue_completed_msg
      })

      general_assertions({ added_label: false })
    })

    it('handle when an issue is closed as not planned', async () => {
      // Supported event
      mock_github_context.eventName = 'issues'
      mock_github_context.payload.action = 'closed'
      mock_github_context.payload.issue = { number: 8, user: { login: 'ghosty' }, state_reason: 'not_planned' }
      // Mock requests
      octokit_listForRepo_mock.mockReturnValue({ data: [{}] })
      octokit_createComment_mock.mockReturnValue({ data: { html_url: created_comment_url } })

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'issue', state: 'not-planned' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [issue_labels],
        msg: issue_not_planned_msg
      })

      general_assertions({ added_label: false })
    })
  })
})
