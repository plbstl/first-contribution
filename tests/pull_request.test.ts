/**
 * Unit tests for the `pull_request` and `pull_request_target` events.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import * as main from '../src/main.ts'
import {
  created_comment_url,
  general_assertions,
  get_action_inputs_spy,
  get_fc_event_spy,
  pr_closed_msg,
  pr_labels,
  pr_merged_msg,
  pr_opened_msg
} from './helpers.ts'
import {
  mock_github_context,
  octokit_createComment_mock,
  octokit_listForRepo_mock,
  reset_mock_github_context
} from './setup.ts'

describe('pull_request', () => {
  beforeEach(() => {
    reset_mock_github_context()
  })

  describe('.opened', () => {
    // Mock requests
    octokit_listForRepo_mock.mockReturnValue({ data: [{ pull_request: [{}] }] })
    octokit_createComment_mock.mockReturnValue({ data: { html_url: created_comment_url } })

    it('handles when a new pull request is opened', async () => {
      // Supported event
      mock_github_context.eventName = 'pull_request_target'
      mock_github_context.payload.action = 'opened'
      mock_github_context.payload.pull_request = { number: 4, user: { login: 'randy' } }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'pr', state: 'opened' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [pr_labels],
        msg: pr_opened_msg
      })

      general_assertions({ added_label: true })
    })
  })

  describe('.closed', () => {
    it('handles when a pull request is merged', async () => {
      // Supported event
      mock_github_context.eventName = 'pull_request_target'
      mock_github_context.payload.action = 'closed'
      mock_github_context.payload.pull_request = { number: 4, user: { login: 'randy' }, merged: true }

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'pr', state: 'merged' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [pr_labels],
        msg: pr_merged_msg
      })

      general_assertions({ added_label: false })
    })

    it('handles when a pull request is closed WITHOUT being merged', async () => {
      // Supported event
      mock_github_context.eventName = 'pull_request_target'
      mock_github_context.payload.action = 'closed'
      mock_github_context.payload.pull_request = { number: 4, user: { login: 'randy' }, merged: false }
      // Mock requests
      octokit_listForRepo_mock.mockReturnValue({ data: [{ pull_request: [{}] }] })
      octokit_createComment_mock.mockReturnValue({ data: { html_url: created_comment_url } })

      await main.run()

      expect(get_fc_event_spy).toHaveReturnedWith({ name: 'pr', state: 'closed' })
      expect(get_action_inputs_spy).toHaveReturnedWith({
        labels: [pr_labels],
        msg: pr_closed_msg
      })

      general_assertions({ added_label: false })
    })
  })
})
