/**
 * Unit tests for the action's utilities, src/utils/*.ts
 */

import * as core from '@actions/core'
import type { WebhookPayload } from '@actions/github/lib/interfaces.d.ts'
import { beforeEach, describe, expect, it, vitest } from 'vitest'
import {
  addLabels,
  createComment,
  getActionInputs,
  getFCEvent,
  isFirstTimeContributor,
  isSupportedEvent
} from '../src/utils/index.ts'
import { getOctokitMock, octokitAddLabelsMock, octokitCreateCommentMock, octokitListForRepoMock } from './setup.ts'

// Spy on the GitHub Actions core library
const getInputSpy = vitest.spyOn(core, 'getInput')

// Mock the GitHub Actions octokit client library
const octokit = getOctokitMock()

describe('utils', () => {
  describe('getActionInputs()', () => {
    describe('.labels', () => {
      it('returns the correct labels for `-labels` inputs', () => {
        // Mock return values from core.getInput()
        getInputSpy.mockImplementation(name => {
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
        const { labels: issueLabels } = getActionInputs({ name: 'issue', state: 'opened' })
        expect(issueLabels).toEqual(['first-timer'])

        // Pull Request
        const { labels: pullRequestLabels } = getActionInputs({ name: 'pr', state: 'opened' })
        expect(pullRequestLabels).toEqual(['label1', 'label2', 'label3', 'spaced     label4'])
      })

      it('returns fallback (if any) when a specific `-labels` input is unavailable', () => {
        // Mock return values from core.getInput()
        getInputSpy.mockImplementation(name => {
          return name === 'labels' ? 'first-time contributor, first-interaction' : ''
        })

        // Issue
        const { labels: issueLabels } = getActionInputs({ name: 'issue', state: 'opened' })
        expect(issueLabels).toEqual(['first-time contributor', 'first-interaction'])

        // Pull Request
        const { labels: pullRequestLabels } = getActionInputs({ name: 'pr', state: 'opened' })
        expect(pullRequestLabels).toEqual(['first-time contributor', 'first-interaction'])
      })

      it('returns an empty array when no `-labels` input is provided', () => {
        // Mock return values from core.getInput()
        getInputSpy.mockReturnValue('')

        // Issue
        const { labels: issueLabels } = getActionInputs({ name: 'issue', state: 'opened' })
        expect(issueLabels).toEqual([])

        // Pull Request
        const { labels: pullRequestLabels } = getActionInputs({ name: 'pr', state: 'opened' })
        expect(pullRequestLabels).toEqual([])
      })
    })

    describe('.msg', () => {
      it('returns the correct messages for all `-msg` inputs', () => {
        // Mock return values from core.getInput()
        getInputSpy.mockImplementation(name => {
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
        const { msg: issueOpenedMsg } = getActionInputs({ name: 'issue', state: 'opened' })
        expect(issueOpenedMsg).toMatch('Issue opened message')

        const { msg: issueCompletedMsg } = getActionInputs({ name: 'issue', state: 'completed' })
        expect(issueCompletedMsg).toMatch('Issue completed message')

        const { msg: issueNotPlannedMsg } = getActionInputs({ name: 'issue', state: 'not-planned' })
        expect(issueNotPlannedMsg).toMatch('Issue not planned message')

        // Pull Requests
        const { msg: pullRequestOpenedMsg } = getActionInputs({ name: 'pr', state: 'opened' })
        expect(pullRequestOpenedMsg).toMatch('PR opened message')

        const { msg: pullRequestMergedMsg } = getActionInputs({ name: 'pr', state: 'merged' })
        expect(pullRequestMergedMsg).toMatch('PR merged message')

        const { msg: pullRequestClosedMsg } = getActionInputs({ name: 'pr', state: 'closed' })
        expect(pullRequestClosedMsg).toMatch('PR closed message')
      })

      it("returns a correct message when `-msg` input is 'symlinked'", () => {
        // Mock return values from core.getInput()
        getInputSpy.mockImplementation(name => {
          switch (name) {
            case 'issue-completed-msg':
              return 'Issue completed message'
            case 'pr-merged-msg':
              return 'issue-completed-msg'
            default:
              return ''
          }
        })

        const { msg: pullRequestMergedMsg } = getActionInputs({ name: 'pr', state: 'merged' })
        expect(pullRequestMergedMsg).toMatch('Issue completed message')
      })

      it('trims leading/trailing whitespace and line terminator characters in `-msg` inputs', () => {
        // Mock return values from core.getInput()
        getInputSpy.mockImplementation(name => {
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

        const { msg: issueOpenedMsg } = getActionInputs({ name: 'issue', state: 'opened' })
        expect(issueOpenedMsg).toMatch('')

        const { msg: pullRequestOpenedMsg } = getActionInputs({ name: 'pr', state: 'opened' })
        expect(pullRequestOpenedMsg).toMatch('')

        const { msg: pullRequestMergedMsg } = getActionInputs({ name: 'pr', state: 'merged' })
        expect(pullRequestMergedMsg).toMatch('o p')

        const { msg: pullRequestClosedMsg } = getActionInputs({ name: 'pr', state: 'closed' })
        expect(pullRequestClosedMsg).toMatch('- -     -')
      })
    })
  })

  describe('addLabels()', () => {
    it('adds labels to a new issue or pull request', async () => {
      const addLabelsOpts = {
        issue_number: 1,
        labels: ['first label', 'label2'],
        owner: 'owner',
        repo: 'repo'
      }

      const didAddLabels = await addLabels(octokit, 'opened', addLabelsOpts)
      expect(octokitAddLabelsMock).toHaveBeenCalledWith(addLabelsOpts)
      expect(didAddLabels).toBe(true)
    })

    it('does not add labels when the list of labels is empty', async () => {
      const addLabelsOpts = {
        issue_number: 2,
        labels: [],
        owner: 'owner',
        repo: 'repo'
      }

      const didAddLabels = await addLabels(octokit, 'opened', addLabelsOpts)
      expect(octokitAddLabelsMock).not.toHaveBeenCalled()
      expect(didAddLabels).toBe(false)
    })

    it('does not add labels when the event payload action is NOT `opened`', async () => {
      const addLabelsOpts = {
        issue_number: 3,
        labels: ['valid list', 'first-timer'],
        owner: 'owner',
        repo: 'repo'
      }

      await addLabels(octokit, 'closed', addLabelsOpts)
      expect(octokitAddLabelsMock).not.toHaveBeenCalled()
    })
  })

  describe('createComment()', () => {
    it('comments on an issue or pull request', async () => {
      const createdCommentUrl = 'https://gh.repo/comment'
      octokitCreateCommentMock.mockReturnValue({ data: { html_url: createdCommentUrl } })
      const createCommentOpts = {
        body: 'Message body',
        issue_number: 1,
        owner: 'owner',
        repo: 'repo'
      }

      const commentUrl = await createComment(octokit, { ...createCommentOpts, author_username: 'randomUser007' })

      expect(commentUrl).toBe(createdCommentUrl)
      expect(octokitCreateCommentMock).toHaveBeenCalledWith(createCommentOpts)
    })

    it('does not comment when the input message is empty', async () => {
      const createCommentOpts = {
        body: '',
        issue_number: 2,
        owner: 'owner',
        repo: 'repo',
        author_username: 'randomUser007'
      }

      const commentUrl = await createComment(octokit, createCommentOpts)

      expect(commentUrl).toBe('')
      expect(octokitCreateCommentMock).not.toHaveBeenCalled()
    })
  })

  describe('getFCEvent()', () => {
    it('identifies an opened issue', () => {
      const payload = { issue: { title: 'New bug' } } as unknown as WebhookPayload
      const event = getFCEvent('opened', payload)
      expect(event).toEqual({ name: 'issue', state: 'opened' })
    })

    it('identifies an opened pull request', () => {
      const payload = { pull_request: { title: 'New feature' } } as unknown as WebhookPayload
      const event = getFCEvent('opened', payload)
      expect(event).toEqual({ name: 'pr', state: 'opened' })
    })

    it('identifies a completed issue', () => {
      const payload = { issue: { title: 'Old bug', state_reason: 'completed' } } as unknown as WebhookPayload
      const event = getFCEvent('closed', payload)
      expect(event).toEqual({ name: 'issue', state: 'completed' })
    })

    it('identifies a not-planned issue', () => {
      const payload = { issue: { title: 'Wont fix', state_reason: 'not_planned' } } as unknown as WebhookPayload
      const event = getFCEvent('closed', payload)
      expect(event).toEqual({ name: 'issue', state: 'not-planned' })
    })

    it('identifies a merged pull request', () => {
      const payload = { pull_request: { title: 'Old feature', merged: true } } as unknown as WebhookPayload
      const event = getFCEvent('closed', payload)
      expect(event).toEqual({ name: 'pr', state: 'merged' })
    })

    it('identifies a closed (unmerged) pull request', () => {
      const payload = { pull_request: { title: 'Rejected feature', merged: false } } as unknown as WebhookPayload
      const event = getFCEvent('closed', payload)
      expect(event).toEqual({ name: 'pr', state: 'closed' })
    })
  })

  describe('isFirstTimeContributor()', () => {
    const defaultOpts = {
      creator: 'ghosty',
      owner: 'owner',
      repo: 'repo'
    }

    describe('contribution-mode = once', () => {
      beforeEach(() => {
        getInputSpy.mockReturnValue('once')
      })

      it('returns true if the user has only one contribution (issue or PR)', async () => {
        octokitListForRepoMock.mockReturnValue({ data: [{}] })
        await expect(isFirstTimeContributor(octokit, { ...defaultOpts, is_pull_request: false })).resolves.toBe(true)
      })

      it('returns false if the user has multiple contributions', async () => {
        octokitListForRepoMock.mockReturnValue({ data: [{}, { pull_request: {} }] })
        await expect(isFirstTimeContributor(octokit, { ...defaultOpts, is_pull_request: false })).resolves.toBe(false)
      })
    })

    describe('contribution-mode = (default)', () => {
      it('returns true for a first issue, even with a prior PR', async () => {
        octokitListForRepoMock.mockReturnValue({ data: [{}, { pull_request: {} }] })
        await expect(isFirstTimeContributor(octokit, { ...defaultOpts, is_pull_request: false })).resolves.toBe(true)
      })

      it('returns false for a subsequent issue', async () => {
        octokitListForRepoMock.mockReturnValue({ data: [{}, {}] })
        await expect(isFirstTimeContributor(octokit, { ...defaultOpts, is_pull_request: false })).resolves.toBe(false)
      })

      it('returns true for a first PR, even with a prior issue', async () => {
        octokitListForRepoMock.mockReturnValue({ data: [{ pull_request: {} }, {}] })
        await expect(isFirstTimeContributor(octokit, { ...defaultOpts, is_pull_request: true })).resolves.toBe(true)
      })

      it('returns false for a subsequent PR', async () => {
        octokitListForRepoMock.mockReturnValue({ data: [{ pull_request: {} }, { pull_request: {} }] })
        await expect(isFirstTimeContributor(octokit, { ...defaultOpts, is_pull_request: true })).resolves.toBe(false)
      })
    })
  })

  describe('isSupportedEvent()', () => {
    it('determines whether the triggered event is supported or not', () => {
      expect(isSupportedEvent('issues', 'opened')).toBe(true)
      expect(isSupportedEvent('pull_request', 'closed')).toBe(true)
      expect(isSupportedEvent('pull_request_target', 'opened')).toBe(true)

      expect(isSupportedEvent('discussion', 'created')).toBe(false)
      expect(isSupportedEvent('issue_comment', 'created')).toBe(false)
      expect(isSupportedEvent('issues', 'unassigned')).toBe(false)
      expect(isSupportedEvent('pull_request', 'reopened')).toBe(false)
      expect(isSupportedEvent('pull_request_review_comment', 'deleted')).toBe(false)
      expect(isSupportedEvent('pull_request_target', 'labeled')).toBe(false)
    })
  })
})
