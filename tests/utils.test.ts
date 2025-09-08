/**
 * Unit tests for the action's utilities, src/utils/*.ts
 */

import type { WebhookPayload } from '@actions/github/lib/interfaces.d.ts'
import { beforeEach, describe, expect, it, vitest } from 'vitest'
import * as utils from '../src/utils/index.ts'
import {
  add_labels,
  create_comment,
  get_action_inputs,
  get_fc_event,
  is_first_time_contributor,
  is_supported_event
} from '../src/utils/index.ts'
import { get_input_spy_mock } from './helpers.ts'
import {
  getOctokit_mock,
  octokit_addLabels_mock,
  octokit_createComment_mock,
  octokit_listForRepo_mock
} from './setup.ts'

// Mock the GitHub Actions octokit client library
const octokit = getOctokit_mock()

describe('utils', () => {
  describe('getActionInputs()', () => {
    describe('.labels', () => {
      it('returns the correct labels for `-labels` inputs', () => {
        // Mock return values from core.getInput()
        get_input_spy_mock.mockImplementation(name => {
          switch (name) {
            case 'labels':
              return 'first-time contributor'
            case 'issue-labels':
              return 'first-timer'
            case 'pr-labels':
              return 'label1, label2,label3,      spaced     label4'
            default:
              return ''
          }
        })

        // Issue
        const { labels: issue_labels } = get_action_inputs({ name: 'issue', state: 'opened' })
        expect(issue_labels).toEqual(['first-timer'])

        // Pull Request
        const { labels: pull_request_labels } = get_action_inputs({ name: 'pr', state: 'opened' })
        expect(pull_request_labels).toEqual(['label1', 'label2', 'label3', 'spaced     label4'])
      })

      it('returns fallback (if any) when a specific `-labels` input is unavailable', () => {
        // Mock return values from core.getInput()
        get_input_spy_mock.mockImplementation(name => {
          return name === 'labels' ? 'first-time contributor, first-interaction' : ''
        })

        // Issue
        const { labels: issue_labels } = get_action_inputs({ name: 'issue', state: 'opened' })
        expect(issue_labels).toEqual(['first-time contributor', 'first-interaction'])

        // Pull Request
        const { labels: pull_request_labels } = get_action_inputs({ name: 'pr', state: 'opened' })
        expect(pull_request_labels).toEqual(['first-time contributor', 'first-interaction'])
      })

      it('returns an empty array when no `-labels` input is provided', () => {
        // Mock return values from core.getInput()
        get_input_spy_mock.mockReturnValue('')

        // Issue
        const { labels: issue_labels } = get_action_inputs({ name: 'issue', state: 'opened' })
        expect(issue_labels).toEqual([])

        // Pull Request
        const { labels: pull_request_labels } = get_action_inputs({ name: 'pr', state: 'opened' })
        expect(pull_request_labels).toEqual([])
      })
    })

    describe('.msg', () => {
      it('returns the correct messages for all `-msg` inputs', () => {
        // Mock return values from core.getInput()
        get_input_spy_mock.mockImplementation(name => {
          switch (name) {
            // Issues
            case 'issue-opened-msg':
              return 'Issue opened message'
            case 'issue-completed-msg':
              return 'Issue completed message'
            case 'issue-not-planned-msg':
              return 'Issue not planned message'
            // Pull Requests
            case 'pr-opened-msg':
              return 'PR opened message'
            case 'pr-merged-msg':
              return 'PR merged message'
            case 'pr-closed-msg':
              return 'PR closed message'

            default:
              return ''
          }
        })

        // Issues
        const { msg: issue_opened_msg } = get_action_inputs({ name: 'issue', state: 'opened' })
        expect(issue_opened_msg).toMatch('Issue opened message')

        const { msg: issue_completed_msg } = get_action_inputs({ name: 'issue', state: 'completed' })
        expect(issue_completed_msg).toMatch('Issue completed message')

        const { msg: issue_not_planned_msg } = get_action_inputs({ name: 'issue', state: 'not-planned' })
        expect(issue_not_planned_msg).toMatch('Issue not planned message')

        // Pull Requests
        const { msg: pull_request_opened_msg } = get_action_inputs({ name: 'pr', state: 'opened' })
        expect(pull_request_opened_msg).toMatch('PR opened message')

        const { msg: pull_request_merged_msg } = get_action_inputs({ name: 'pr', state: 'merged' })
        expect(pull_request_merged_msg).toMatch('PR merged message')

        const { msg: pull_request_closed_msg } = get_action_inputs({ name: 'pr', state: 'closed' })
        expect(pull_request_closed_msg).toMatch('PR closed message')
      })

      it("returns a correct message when `-msg` input is 'symlinked'", () => {
        // Mock return values from core.getInput()
        get_input_spy_mock.mockImplementation(name => {
          switch (name) {
            case 'issue-completed-msg':
              return 'Issue completed message'
            case 'pr-merged-msg':
              return 'issue-completed-msg'
            default:
              return ''
          }
        })

        const { msg: pull_request_merged_msg } = get_action_inputs({ name: 'pr', state: 'merged' })
        expect(pull_request_merged_msg).toMatch('Issue completed message')
      })

      it('trims leading/trailing whitespace and line terminator characters in `-msg` inputs', () => {
        // Mock return values from core.getInput()
        get_input_spy_mock.mockImplementation(name => {
          switch (name) {
            case 'issue-opened-msg':
              return '      '
            case 'pr-opened-msg':
              return '\n\n\n\n\n\n\n\n'
            case 'pr-merged-msg':
              return '  \n\n\no p    \n  \n  \n '
            case 'pr-closed-msg':
              return '        - -     -  '
            default:
              return ''
          }
        })

        const { msg: issue_opened_msg } = get_action_inputs({ name: 'issue', state: 'opened' })
        expect(issue_opened_msg).toMatch('')

        const { msg: pull_request_opened_msg } = get_action_inputs({ name: 'pr', state: 'opened' })
        expect(pull_request_opened_msg).toMatch('')

        const { msg: pull_request_merged_msg } = get_action_inputs({ name: 'pr', state: 'merged' })
        expect(pull_request_merged_msg).toMatch('o p')

        const { msg: pull_request_closed_msg } = get_action_inputs({ name: 'pr', state: 'closed' })
        expect(pull_request_closed_msg).toMatch('- -     -')
      })
    })
  })

  describe('addLabels()', () => {
    it('adds labels to a new issue or pull request', async () => {
      const add_labels_opts = {
        issue_number: 1,
        labels: ['first label', 'label2'],
        owner: 'owner',
        repo: 'repo'
      }

      const did_add_labels = await add_labels(octokit, 'opened', add_labels_opts)
      expect(octokit_addLabels_mock).toHaveBeenCalledWith(add_labels_opts)
      expect(did_add_labels).toBe(true)
    })

    it('does not add labels when the list of labels is empty', async () => {
      const add_labels_opts = {
        issue_number: 2,
        labels: [],
        owner: 'owner',
        repo: 'repo'
      }

      const did_add_labels = await add_labels(octokit, 'opened', add_labels_opts)
      expect(octokit_addLabels_mock).not.toHaveBeenCalled()
      expect(did_add_labels).toBe(false)
    })

    it('does not add labels when the event payload action is NOT `opened`', async () => {
      const add_labels_opts = {
        issue_number: 3,
        labels: ['valid list', 'first-timer'],
        owner: 'owner',
        repo: 'repo'
      }

      await add_labels(octokit, 'closed', add_labels_opts)
      expect(octokit_addLabels_mock).not.toHaveBeenCalled()
    })
  })

  describe('createComment()', () => {
    it('comments on an issue or pull request', async () => {
      const created_comment_url = 'https://gh.repo/comment'
      octokit_createComment_mock.mockReturnValue({ data: { html_url: created_comment_url } })
      const create_comment_opts = {
        body: 'Message body',
        issue_number: 1,
        owner: 'owner',
        repo: 'repo'
      }

      const comment_url = await create_comment(octokit, { ...create_comment_opts, author_username: 'randomUser007' })

      expect(comment_url).toBe(created_comment_url)
      expect(octokit_createComment_mock).toHaveBeenCalledWith(create_comment_opts)
    })

    it('does not comment when the input message is empty', async () => {
      const create_comment_opts = {
        body: '',
        issue_number: 2,
        owner: 'owner',
        repo: 'repo',
        author_username: 'randomUser007'
      }

      const comment_url = await create_comment(octokit, create_comment_opts)

      expect(comment_url).toBe('')
      expect(octokit_createComment_mock).not.toHaveBeenCalled()
    })
  })

  describe('getFCEvent()', () => {
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

  describe('isFirstTimeContributor()', () => {
    const default_opts = {
      creator: 'ghosty',
      owner: 'owner',
      repo: 'repo'
    }

    const is_first_time_contributor_spy = vitest.spyOn(utils, 'is_first_time_contributor')

    describe('contribution-mode = once', () => {
      beforeEach(() => {
        get_input_spy_mock.mockReturnValue('once')
      })

      it('returns true if the user has only one contribution (issue or PR)', async () => {
        octokit_listForRepo_mock.mockReturnValue({ data: [{}] })

        await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

        expect(is_first_time_contributor_spy).toHaveResolvedWith(true)
      })

      it('returns false if the user has multiple contributions', async () => {
        octokit_listForRepo_mock.mockReturnValue({ data: [{}, { pull_request: {} }] })

        await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

        expect(is_first_time_contributor_spy).toHaveResolvedWith(false)
      })
    })

    describe('contribution-mode = (default)', () => {
      beforeEach(() => {
        get_input_spy_mock.mockReturnValue('')
      })

      it('returns true for a first issue, even with a prior PR', async () => {
        octokit_listForRepo_mock.mockReturnValue({ data: [{}, { pull_request: {} }] })

        await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

        expect(is_first_time_contributor_spy).toHaveResolvedWith(true)
      })

      it('returns false for a subsequent issue', async () => {
        octokit_listForRepo_mock.mockReturnValue({ data: [{}, {}] })

        await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

        expect(is_first_time_contributor_spy).toHaveResolvedWith(false)
      })

      it('returns true for a first PR, even with a prior issue', async () => {
        octokit_listForRepo_mock.mockReturnValue({ data: [{ pull_request: {} }, {}] })

        await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

        expect(is_first_time_contributor_spy).toHaveResolvedWith(true)
      })

      it('returns false for a subsequent PR', async () => {
        octokit_listForRepo_mock.mockReturnValue({ data: [{ pull_request: {} }, { pull_request: {} }] })

        await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

        expect(is_first_time_contributor_spy).toHaveResolvedWith(false)
      })
    })
  })

  describe('isSupportedEvent()', () => {
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
})
