/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * Unit tests for the action's utilities, src/utils/*.ts
 */

import * as core from '@actions/core'
import type { GitHub } from '@actions/github/lib/utils'
import { getActionInputs } from '../src/utils/action-inputs'
import { addLabels } from '../src/utils/add-labels'
import { createComment } from '../src/utils/create-comment'
import { isFirstTimeContributor } from '../src/utils/is-first-time-contributor'
import { isSupportedEvent } from '../src/utils/is-supported-event'

// Spy on the GitHub Actions core library
const getInputSpy = jest.spyOn(core, 'getInput')

// Mock listing repository issues using REST API
const octokitListForRepoMock = jest.fn()

// Mock creating a comment using REST API
const octokitCreateCommentMock = jest.fn().mockReturnValue({ data: { html_url: 'https://example.com' } })

// Mock adding labels using REST API
const octokitAddLabelsMock = jest.fn()

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

// Mock an Octokit response error
class ResponseErrorMock extends Error {
  private _response: unknown

  constructor(status: number, message: string) {
    super(message)
    this._response = { status, data: { message } }
  }

  get response(): unknown {
    return this._response
  }
}

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
    it('determine whether the issue author is a first-time contributor or not', async () => {
      const githubContext = {
        repo: { owner: 'owner', repo: 'repo' },
        payload: { issue: { user: { login: 'ghosty' } } }
      } as unknown as typeof import('@actions/github').context

      // 1 issue
      octokitListForRepoMock.mockReturnValue({ data: [{}] })
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(true)

      // 1 issue, 1 pull request
      octokitListForRepoMock.mockReturnValue({ data: [{}, { pull_request: {} }] })
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(true)

      // multiple issues
      octokitListForRepoMock.mockReturnValue({ data: [{}, {}] })
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(false)
    })

    it('determine whether the pull request author is a first-time contributor or not', async () => {
      const githubContext = {
        payload: { pull_request: { author_association: '' } }
      } as unknown as typeof import('@actions/github').context

      githubContext.payload.pull_request!.author_association = 'FIRST_TIMER'
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(true)

      githubContext.payload.pull_request!.author_association = 'FIRST_TIME_CONTRIBUTOR'
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(true)

      githubContext.payload.pull_request!.author_association = 'CONTRIBUTOR'
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(false)

      githubContext.payload.pull_request!.author_association = 'MANNEQUIN'
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(false)
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

      const commentUrl = await createComment(octokit, createCommentOpts)

      expect(commentUrl).toBe('https://example.com')
      expect(octokitCreateCommentMock).toHaveBeenCalledWith(createCommentOpts)
    })

    it('only add a comment when the input message is NOT empty', async () => {
      const createCommentOpts = {
        body: '',
        issue_number: 2,
        owner: 'owner',
        repo: 'repo'
      }

      const commentUrl = await createComment(octokit, createCommentOpts)

      expect(commentUrl).toBe('')
      expect(octokitCreateCommentMock).not.toHaveBeenCalled()
    })

    it('throw a an error when comment cannot be created', async () => {
      const createCommentOpts = {
        body: 'Message body',
        issue_number: 3,
        owner: 'owner',
        repo: 'repo'
      }

      // Non response error
      octokitCreateCommentMock.mockImplementation(() => {
        throw new Error('error message')
      })
      await expect(createComment(octokit, createCommentOpts)).rejects.toThrow(/^error message$/)

      // Response error
      octokitCreateCommentMock.mockImplementation(() => {
        throw new ResponseErrorMock(407, 'response error')
      })
      await expect(createComment(octokit, createCommentOpts)).rejects.toThrow('407')
      await expect(createComment(octokit, createCommentOpts)).rejects.toThrow('response error')
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

      await addLabels(octokit, 'opened', addLabelsOpts)
      expect(octokitAddLabelsMock).toHaveBeenCalledWith(addLabelsOpts)
    })

    it('only add labels when the list of labels is NOT empty', async () => {
      const addLabelsOpts = {
        issue_number: 2,
        labels: [],
        owner: 'owner',
        repo: 'repo'
      }

      await addLabels(octokit, 'opened', addLabelsOpts)
      expect(octokitAddLabelsMock).not.toHaveBeenCalled()
    })

    it('do not add labels when the event payload action is NOT `opened`', async () => {
      const addLabelsOpts = {
        issue_number: 3,
        labels: ['valid list', 'first-timer'],
        owner: 'owner',
        repo: 'repo'
      }

      await addLabels(octokit, 'reopened', addLabelsOpts)
      expect(octokitAddLabelsMock).not.toHaveBeenCalled()

      await addLabels(octokit, 'created', addLabelsOpts)
      expect(octokitAddLabelsMock).not.toHaveBeenCalled()

      await addLabels(octokit, 'closed', addLabelsOpts)
      expect(octokitAddLabelsMock).not.toHaveBeenCalled()
    })

    it('throw an error when labels cannot be added', async () => {
      const addLabelsOpts = {
        issue_number: 3,
        labels: ['valid list', 'first-timer'],
        owner: 'owner',
        repo: 'repo'
      }

      // Non response error
      octokitAddLabelsMock.mockImplementation(() => {
        throw new Error('error message')
      })
      await expect(addLabels(octokit, 'opened', addLabelsOpts)).rejects.toThrow(/^error message$/)

      // Response error
      octokitAddLabelsMock.mockImplementation(() => {
        throw new ResponseErrorMock(407, 'response error')
      })
      await expect(addLabels(octokit, 'opened', addLabelsOpts)).rejects.toThrow('407')
      await expect(addLabels(octokit, 'opened', addLabelsOpts)).rejects.toThrow('response error')
    })
  })
})