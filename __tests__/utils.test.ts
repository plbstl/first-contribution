/**
 * Unit tests for the action's utilities, src/utils/*.ts
 */

import * as core from '@actions/core'
import type { GitHub } from '@actions/github/lib/utils'
import { describe, expect, it, vitest } from 'vitest'
import { addLabels, createComment, getActionInputs, isFirstTimeContributor, isSupportedEvent } from '../src/utils'

// Spy on the GitHub Actions core library
const getInputSpy = vitest.spyOn(core, 'getInput')

// Mock listing repository issues using REST API
const octokitListForRepoMock = vitest.fn()

// Mock creating a comment using REST API
const octokitCreateCommentMock = vitest.fn(() => ({ data: { html_url: 'https://example.com' } }))

// Mock adding labels using REST API
const octokitAddLabelsMock = vitest.fn()

// Mock the GitHub Actions octokit client library
const octokit = {
  rest: {
    issues: {
      addLabels: octokitAddLabelsMock,
      createComment: octokitCreateCommentMock,
      listForRepo: octokitListForRepoMock
    }
  }
} as unknown as InstanceType<typeof GitHub>

describe('utils', () => {
  describe('isSupportedEvent()', () => {
    it('determine whether the triggered event is supported or not', () => {
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

  describe('isFirstTimeContributor()', () => {
    const opts = {
      creator: 'ghosty',
      owner: 'owner',
      repo: 'repo',
      isPullRequest: false
    }

    it.skip('determine whether the issue author is a first-time contributor or not', async () => {
      // 1 issue
      octokitListForRepoMock.mockReturnValue({ data: [{}] })
      await expect(isFirstTimeContributor(octokit, opts)).resolves.toBe(true)

      // 1 issue, 1 pull request
      octokitListForRepoMock.mockReturnValue({ data: [{}, { pull_request: {} }] })
      await expect(isFirstTimeContributor(octokit, opts)).resolves.toBe(false)

      // multiple issues
      octokitListForRepoMock.mockReturnValue({ data: [{}, {}] })
      await expect(isFirstTimeContributor(octokit, opts)).resolves.toBe(false)
    })

    it.skip('determine whether the pull request author is a first-time contributor or not', async () => {
      // 1 pull request
      octokitListForRepoMock.mockReturnValue({ data: [{ pull_request: {} }] })
      await expect(isFirstTimeContributor(octokit, opts)).resolves.toBe(true)

      // 1 pull request, 1 issue
      octokitListForRepoMock.mockReturnValue({ data: [{ pull_request: {} }, {}] })
      await expect(isFirstTimeContributor(octokit, opts)).resolves.toBe(false)

      // multiple pull requests
      octokitListForRepoMock.mockReturnValue({ data: [{ pull_request: {} }, { pull_request: {} }] })
      await expect(isFirstTimeContributor(octokit, opts)).resolves.toBe(false)
    })
  })

  describe('getActionInputs()', () => {
    describe('.labels', () => {
      it('return the correct labels for `-labels` inputs', () => {
        // Set the action's inputs as return values from core.getInput()
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

        // Issue - `state` is not used
        const { labels: issueLabels } = getActionInputs({ name: 'issue', state: 'opened' })
        expect(issueLabels).toEqual(['first-timer'])

        // Pull Request - `state` is not used
        const { labels: pullRequestLabels } = getActionInputs({ name: 'pr', state: 'opened' })
        expect(pullRequestLabels).toEqual(['label1', 'label2', 'label3', 'spaced     label4'])
      })

      it('return fallback (if any) when a specific `-labels` input is unavailable', () => {
        // Set the action's inputs as return values from core.getInput()
        getInputSpy.mockImplementation(name => {
          return name === 'labels' ? 'first-time contributor, first-interaction' : ''
        })

        // Issue - `state` is not used
        const { labels: issueLabels } = getActionInputs({ name: 'issue', state: 'opened' })
        expect(issueLabels).toEqual(['first-time contributor', 'first-interaction'])

        // Pull Request - `state` is not used
        const { labels: pullRequestLabels } = getActionInputs({ name: 'pr', state: 'opened' })
        expect(pullRequestLabels).toEqual(['first-time contributor', 'first-interaction'])
      })

      it('return an empty array when no `-labels` input is provided', () => {
        // Set the action's inputs as return values from core.getInput()
        getInputSpy.mockReturnValue('')

        // Issue - `state` is not used
        const { labels: issueLabels } = getActionInputs({ name: 'issue', state: 'opened' })
        expect(issueLabels).toEqual([])

        // Pull Request - `state` is not used
        const { labels: pullRequestLabels } = getActionInputs({ name: 'pr', state: 'opened' })
        expect(pullRequestLabels).toEqual([])
      })
    })

    describe('.msg', () => {
      it('return the correct messages for `-msg` inputs', () => {
        // Testing all `-msg` inputs as they should be changed meticulously
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

      it("return a correct message when `-msg` input is 'symlinked'", () => {
        // Set the action's inputs as return values from core.getInput()
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

      it('trim leading/trailing whitespace and line terminator characters in `-msg` inputs', () => {
        // Set the action's inputs as return values from core.getInput()
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

  describe('createComment()', () => {
    it('comment on an issue or pull request', async () => {
      const createCommentOpts = {
        body: 'Message body',
        issue_number: 1,
        owner: 'owner',
        repo: 'repo'
      }

      const commentUrl = await createComment(octokit, { ...createCommentOpts, author_username: 'randomUser007' })

      expect(commentUrl).toBe('https://example.com')
      expect(octokitCreateCommentMock).toHaveBeenCalledWith(createCommentOpts)
    })

    it('only add a comment when the input message is NOT empty', async () => {
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

  describe('addLabels()', () => {
    it('add labels to a new issue or pull request', async () => {
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

    it('only add labels when the list of labels is NOT empty', async () => {
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

    it('do not add labels when the event payload action is NOT `opened`', async () => {
      const addLabelsOpts = {
        issue_number: 3,
        labels: ['valid list', 'first-timer'],
        owner: 'owner',
        repo: 'repo'
      }

      // await addLabels(octokit, 'reopened', addLabelsOpts)
      // expect(octokitAddLabelsMock).not.toHaveBeenCalled()

      // await addLabels(octokit, 'created', addLabelsOpts)
      // expect(octokitAddLabelsMock).not.toHaveBeenCalled()

      await addLabels(octokit, 'closed', addLabelsOpts)
      expect(octokitAddLabelsMock).not.toHaveBeenCalled()
    })
  })
})
