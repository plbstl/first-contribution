import type { GitHub } from '@actions/github/lib/utils.d.ts'
import { vitest } from 'vitest'

vitest.mock('@actions/github', () => {
  return {
    context: github_context_mock,
    getOctokit: getOctokit_mock
  }
})

type IssueOrPullRequestStub = { number: number; user: { login: string }; [key: string]: unknown } | undefined

/** `'@actions/github'.context` */
export const github_context_mock = {
  eventName: 'eventName',
  repo: { owner: 'owner', repo: 'repo' },
  payload: {
    action: 'action',
    issue: undefined as IssueOrPullRequestStub,
    pull_request: undefined as IssueOrPullRequestStub
  }
}

export const reset_mock_github_context = (): void => {
  github_context_mock.eventName = 'eventName'
  github_context_mock.repo = { owner: 'owner', repo: 'repo' }
  github_context_mock.payload.action = 'action'
  github_context_mock.payload.issue = undefined
  github_context_mock.payload.pull_request = undefined
}

// Mock octokit client
export const octokit_addLabels_mock = vitest.fn()
export const octokit_createComment_mock = vitest.fn()
export const octokit_listForRepo_mock = vitest.fn()
export const octokit_listCommits_mock = vitest.fn()

export const getOctokit_mock = vitest.fn(
  () =>
    ({
      rest: {
        repos: {
          listCommits: octokit_listCommits_mock
        },
        issues: {
          addLabels: octokit_addLabels_mock,
          createComment: octokit_createComment_mock,
          listForRepo: octokit_listForRepo_mock
        }
      }
    }) as unknown as InstanceType<typeof GitHub>
)
