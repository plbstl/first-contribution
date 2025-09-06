import type { GitHub } from '@actions/github/lib/utils.d.ts'
import { vitest } from 'vitest'

vitest.mock('@actions/github', () => {
  return {
    context: mockGithubContext.context,
    getOctokit: getOctokitMock
  }
})

/** `'@actions/github'.context` */
export const defaultGithubContextForTests = {
  eventName: 'eventName',
  repo: { owner: 'owner', repo: 'repo' },
  payload: {
    action: 'action',
    issue: { number: 123, user: { login: 'ghosty' } },
    pull_request: undefined
  }
}

export const mockGithubContext = { context: { ...defaultGithubContextForTests } }

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
