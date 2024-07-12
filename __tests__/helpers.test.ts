/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import type { GitHub } from '@actions/github/lib/utils'
import { isFirstTimeContributor, isSupportedEvent } from '../src/utils/helpers'

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
})
