import * as core from '@actions/core'
import { expect, vitest } from 'vitest'
import * as main from '../src/main.ts'
import * as utils from '../src/utils/index.ts'

/** URL of the comment made to first timer */
export const created_comment_url = 'html_url.com'

/** Number of action outputs */
export const NUMBER_OF_ACTION_OUTPUTS = 4

// Spy on the action's main function
export const run_spy = vitest.spyOn(main, 'run')

// Spy on the acton's utils
export const get_action_inputs_spy = vitest.spyOn(utils, 'get_action_inputs')
export const add_labels_spy = vitest.spyOn(utils, 'add_labels')
export const create_comment_spy = vitest.spyOn(utils, 'create_comment')
export const get_fc_event_spy = vitest.spyOn(utils, 'get_fc_event')
export const is_first_time_contributor_spy = vitest.spyOn(utils, 'is_first_time_contributor')
export const is_supported_event_spy = vitest.spyOn(utils, 'is_supported_event')
export const was_the_first_contribution_spy = vitest.spyOn(utils, 'was_the_first_contribution')

// Mock action inputs
export const issue_labels = 'first timer'
export const issue_opened_msg = 'Thank you for reporting this issue.'
export const issue_completed_msg = 'Issue has been completed!'
export const issue_not_planned_msg = 'We are not going forward with this.'
export const pr_labels = 'first-contrib'
export const pr_opened_msg = 'Thank you for opening this pull request.'
export const pr_merged_msg = 'This PR has been successfully merged!'
export const pr_closed_msg = 'PR was closed. Will not be merged'

// Spy on and mock the GitHub Actions core library
export const core_getBooleanInput_spy = vitest.spyOn(core, 'getBooleanInput')
export const core_error_spy_mock = vitest.spyOn(core, 'error').mockReturnValue()
export const core_setFailed_spy_mock = vitest.spyOn(core, 'setFailed').mockReturnValue()
export const core_setOutput_spy_mock = vitest.spyOn(core, 'setOutput').mockReturnValue()
export const core_getInput_spy_mock = vitest.spyOn(core, 'getInput').mockImplementation(name => {
  switch (name) {
    case 'token':
      return '***'
    case 'issue-labels':
      return issue_labels
    case 'issue-opened-msg':
      return issue_opened_msg
    case 'issue-completed-msg':
      return issue_completed_msg
    case 'issue-not-planned-msg':
      return issue_not_planned_msg
    case 'pr-labels':
      return pr_labels
    case 'pr-opened-msg':
      return pr_opened_msg
    case 'pr-merged-msg':
      return pr_merged_msg
    case 'pr-closed-msg':
      return pr_closed_msg
    default:
      return ''
  }
})

// Functions
export function general_assertions(): void {
  expect(is_supported_event_spy).toHaveReturnedWith(true)
  expect(run_spy).toHaveReturned()
}

export function general_assertions_opened_issue_or_pull_request(): void {
  general_assertions()
  expect(add_labels_spy).toHaveResolvedWith(true)
  expect(core_getInput_spy_mock).toHaveBeenCalledTimes(['token', 'labels', 'msg', 'contribution-mode'].length)
  // Assert that the correct function was used
  expect(is_first_time_contributor_spy).toHaveResolvedWith(true)
  expect(was_the_first_contribution_spy).not.toHaveBeenCalled()
}

export function general_assertions_closed_issue_or_pull_request(): void {
  general_assertions()
  expect(add_labels_spy).toHaveResolvedWith(false)
  // Assert that the correct function was used
  expect(was_the_first_contribution_spy).toHaveResolvedWith(true)
  expect(is_first_time_contributor_spy).not.toHaveBeenCalled()
}
