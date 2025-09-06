import * as core from '@actions/core'
import { expect, vitest } from 'vitest'
import * as main from '../src/main.ts'
import * as utils from '../src/utils/index.ts'

/** URL of the comment made to first timer */
export const createdCommentUrl = 'html_url.com'

/** Number of action outputs */
export const NUMBER_OF_ACTION_OUTPUTS = 4

// Spy on the action's main function
export const runSpy = vitest.spyOn(main, 'run')

// Spy on the acton's utils
export const isFirstTimeContributorSpy = vitest.spyOn(utils, 'isFirstTimeContributor')
export const isSupportedEventSpy = vitest.spyOn(utils, 'isSupportedEvent')
export const getFCEventSpy = vitest.spyOn(utils, 'getFCEvent')
export const getActionInputsSpy = vitest.spyOn(utils, 'getActionInputs')
export const createCommentSpy = vitest.spyOn(utils, 'createComment')
export const addLabelsSpy = vitest.spyOn(utils, 'addLabels')

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
export const setFailedSpyMock = vitest.spyOn(core, 'setFailed').mockReturnValue()
export const setOutputSpyMock = vitest.spyOn(core, 'setOutput').mockReturnValue()
export const getInputSpyMock = vitest.spyOn(core, 'getInput').mockImplementation(name => {
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
export function generalAssertions({ addedLabel }: { addedLabel: boolean }): void {
  expect(isSupportedEventSpy).toHaveReturnedWith(true)

  expect(isFirstTimeContributorSpy).toHaveResolvedWith(true)
  expect(createCommentSpy).toHaveResolvedWith(createdCommentUrl)
  expect(addLabelsSpy).toHaveResolvedWith(addedLabel)

  expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg', 'contribution-mode'].length)
  expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_ACTION_OUTPUTS)

  expect(runSpy).toHaveReturned()
}
