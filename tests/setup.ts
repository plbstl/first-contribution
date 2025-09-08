import type { GitHub } from '@actions/github/lib/utils.d.ts'
import { vitest } from 'vitest'

vitest.mock('@actions/github', () => {
  return {
    context: mock_github_context,
    getOctokit: getOctokit_mock
  }
})

type IssueOrPullRequestStub = { number: number; user: { login: string }; [key: string]: unknown } | undefined

/** `'@actions/github'.context` */
export const mock_github_context = {
  eventName: 'eventName',
  repo: { owner: 'owner', repo: 'repo' },
  payload: {
    action: 'action',
    issue: undefined as IssueOrPullRequestStub,
    pull_request: undefined as IssueOrPullRequestStub
  }
}

export const reset_mock_github_context = (): void => {
  mock_github_context.eventName = 'eventName'
  mock_github_context.repo = { owner: 'owner', repo: 'repo' }
  mock_github_context.payload.action = 'action'
  mock_github_context.payload.issue = undefined
  mock_github_context.payload.pull_request = undefined
}

// Mock octokit client
export const octokit_addLabels_mock = vitest.fn()
export const octokit_createComment_mock = vitest.fn()
export const octokit_listForRepo_mock = vitest.fn()

export const getOctokit_mock = vitest.fn(
  () =>
    ({
      rest: {
        issues: {
          addLabels: octokit_addLabels_mock,
          createComment: octokit_createComment_mock,
          listForRepo: octokit_listForRepo_mock
        }
      }
    }) as unknown as InstanceType<typeof GitHub>
)
