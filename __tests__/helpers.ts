import * as core from '@actions/core'
import * as main from '../src/main'
import * as utils from '../src/utils'

/** URL of the comment made to first timer */
export const createdCommentUrl = 'html_url.com'

/** Number of action outputs */
export const NUMBER_OF_ACTION_OUTPUTS = 4

// Spy on the action's main function
export const runSpy = jest.spyOn(main, 'run')

// Spy on the acton's utils
export const isFirstTimeContributorSpy = jest.spyOn(utils, 'isFirstTimeContributor')
export const isSupportedEventSpy = jest.spyOn(utils, 'isSupportedEvent')
export const getFCEventSpy = jest.spyOn(utils, 'getFCEvent')
export const getActionInputsSpy = jest.spyOn(utils, 'getActionInputs')
export const createCommentSpy = jest.spyOn(utils, 'createComment')
export const addLabelsSpy = jest.spyOn(utils, 'addLabels')

// Mock the GitHub Actions octokit client
export const listForRepoMock = jest.fn()
export const getOctokitMock = jest.fn().mockReturnValue({
  rest: {
    issues: {
      addLabels: jest.fn(),
      createComment: jest.fn().mockReturnValue({ data: { html_url: 'html_url.com' } }),
      listForRepo: listForRepoMock
    }
  }
})

// Mock action inputs
export const issueLabels = 'first timer'
export const issueOpenedMsg = 'Thank you for reporting this issue.'
export const issueCompletedMsg = 'Issue has been completed!'
export const issueNotPlannedMsg = 'We are not going forward with this.'
export const prLabels = 'first-contrib'
export const prOpenedMsg = 'Thank you for opening this pull request.'
export const prMergedMsg = 'This PR has been successfully merged!'
export const prClosedMsg = 'PR was closed. Will not be merged'

// Spy on and mock the GitHub Actions core library
export const setOutputSpyMock = jest.spyOn(core, 'setOutput').mockImplementation()
export const getInputSpyMock = jest.spyOn(core, 'getInput').mockImplementation(name => {
  switch (name) {
    case 'token':
      return '***'
    case 'issue-labels':
      return issueLabels
    case 'issue-opened-msg':
      return issueOpenedMsg
    case 'issue-completed-msg':
      return issueCompletedMsg
    case 'issue-not-planned-msg':
      return issueNotPlannedMsg
    case 'pr-labels':
      return prLabels
    case 'pr-opened-msg':
      return prOpenedMsg
    case 'pr-merged-msg':
      return prMergedMsg
    case 'pr-closed-msg':
      return prClosedMsg
    default:
      return ''
  }
})

// Functions
export async function generalAssertions({ addedLabel }: { addedLabel: boolean }): Promise<void> {
  expect(isSupportedEventSpy).toHaveReturnedWith(true)

  expect(await isFirstTimeContributorSpy.mock.results[0].value)./* resolved value */ toBe(true)
  expect(await createCommentSpy.mock.results[0].value)./* resolved value */ toBe(createdCommentUrl)
  expect(await addLabelsSpy.mock.results[0].value)./* resolved value */ toBe(addedLabel)

  expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
  expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_ACTION_OUTPUTS)

  expect(runSpy).toHaveReturned()
}

export function githubIssueOpened({ isPullRequest }: { isPullRequest: boolean }): never {
  listForRepoMock.mockReturnValue({ data: [{}] })

  const event = isPullRequest ? 'pull_request' : 'issue'

  return {
    getOctokit: getOctokitMock,
    context: {
      eventName: isPullRequest ? 'pull_request' : 'issues',
      repo: { owner: 'owner', repo: 'repo' },
      payload: {
        action: 'opened',
        [event]: { number: 8, user: { login: 'ghosty' } }
      }
    }
  } as never
}

export function githubIssueClosed(
  opts:
    | {
        isPullRequest: false
        state_reason: 'completed' | 'not_planned'
      }
    | {
        isPullRequest: true
        merged: boolean
      }
): never {
  listForRepoMock.mockReturnValue({ data: [{ state: 'closed' }] })

  const event = opts.isPullRequest ? 'pull_request' : 'issue'
  const eventPayload = opts.isPullRequest ? { merged: opts.merged } : { state_reason: opts.state_reason }

  return {
    getOctokit: getOctokitMock,
    context: {
      eventName: opts.isPullRequest ? 'pull_request' : 'issues',
      repo: { owner: 'owner', repo: 'repo' },
      payload: {
        action: 'closed',
        [event]: { number: 8, user: { login: 'ghosty' }, ...eventPayload }
      }
    }
  } as never
}
