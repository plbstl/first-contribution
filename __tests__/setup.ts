import type { GitHub } from '@actions/github/lib/utils.d.ts'
import { vitest } from 'vitest'

vitest.mock('@actions/github', () => {
  return {
    context: mockGithubContext,
    getOctokit: getOctokitMock
  }
})

type IssueOrPullRequestStub = { number: number; user: { login: string }; [key: string]: unknown } | undefined

/** `'@actions/github'.context` */
export const mockGithubContext = {
  eventName: 'eventName',
  repo: { owner: 'owner', repo: 'repo' },
  payload: {
    action: 'action',
    issue: undefined as IssueOrPullRequestStub,
    pull_request: undefined as IssueOrPullRequestStub
  }
}

export const resetMockGithubContext = (): void => {
  mockGithubContext.eventName = 'eventName'
  mockGithubContext.repo = { owner: 'owner', repo: 'repo' }
  mockGithubContext.payload.action = 'action'
  mockGithubContext.payload.issue = undefined
  mockGithubContext.payload.pull_request = undefined
}

// Mock octokit client
export const octokitAddLabelsMock = vitest.fn()
export const octokitCreateCommentMock = vitest.fn()
export const octokitListForRepoMock = vitest.fn()

export const getOctokitMock = vitest.fn(
  () =>
    ({
      rest: {
        issues: {
          addLabels: octokitAddLabelsMock,
          createComment: octokitCreateCommentMock,
          listForRepo: octokitListForRepoMock
        }
      }
    }) as unknown as InstanceType<typeof GitHub>
)
