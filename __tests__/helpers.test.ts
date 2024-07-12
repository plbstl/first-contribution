/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import type { GitHub } from '@actions/github/lib/utils'
import { addLabels, createComment, isFirstTimeContributor, isSupportedEvent } from '../src/utils/helpers'
import { ResponseErrorMock } from './tests-utils'

describe('helpers.ts', () => {
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
    // Mock GitHub octokit client for listing repository issues using REST API.
    const octokitListForRepoMock = jest.fn()
    const octokit = {
      rest: { issues: { listForRepo: octokitListForRepoMock } }
    } as unknown as InstanceType<typeof GitHub>

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

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      githubContext.payload.pull_request!.author_association = 'FIRST_TIMER'
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(true)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      githubContext.payload.pull_request!.author_association = 'FIRST_TIME_CONTRIBUTOR'
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(true)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      githubContext.payload.pull_request!.author_association = 'CONTRIBUTOR'
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(false)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      githubContext.payload.pull_request!.author_association = 'MANNEQUIN'
      await expect(isFirstTimeContributor(githubContext, octokit)).resolves.toBe(false)
    })
  })

  describe('createComment()', () => {
    // Mock '@actions/github' octokit client for creating a comment using REST API
    const octokitCreateCommentMock = jest.fn().mockReturnValue({ data: { html_url: 'https://example.com' } })
    const octokit = {
      rest: { issues: { createComment: octokitCreateCommentMock } }
    } as unknown as InstanceType<typeof GitHub>

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
    // Mock '@actions/github' octokit client for adding labels using REST API
    const octokitAddLabelsMock = jest.fn()
    const octokit = {
      rest: { issues: { addLabels: octokitAddLabelsMock } }
    } as unknown as InstanceType<typeof GitHub>

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
