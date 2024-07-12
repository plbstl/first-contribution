/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * Unit tests for the `issues.closed` event.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import * as actionInputsUtils from '../src/utils/action-inputs'
// import * as createCommentUtils from '../src/utils/create-comment'
import * as fcEventUtils from '../src/utils/fc-event'
// import * as isFirstTimeContributorUtils from '../src/utils/is-first-time-contributor'
import * as isSupportedEventUtils from '../src/utils/is-supported-event'

/** Number of action outputs */
const NUMBER_OF_OUTPUTS = 4

// Spy on the action's main function
const runSpy = jest.spyOn(main, 'run')

// Spy on and mock the GitHub Actions core library
const setOutputSpyMock = jest.spyOn(core, 'setOutput').mockImplementation()
const getInputSpyMock = jest.spyOn(core, 'getInput').mockImplementation(name => {
  switch (name) {
    case 'token':
      return '***'
    case 'issue-labels':
      return 'first timer'
    case 'issue-completed-msg':
      return 'Issue has been completed!'
    case 'issue-not-planned-msg':
      return 'This issue is not planned.'
    default:
      return ''
  }
})

// Spy on the acton's utils
// const isFirstTimeContributorSpy = jest.spyOn(isFirstTimeContributorUtils, 'isFirstTimeContributor')
const isSupportedEventSpy = jest.spyOn(isSupportedEventUtils, 'isSupportedEvent')
const getFCEventSpy = jest.spyOn(fcEventUtils, 'getFCEvent')
const getActionInputsSpy = jest.spyOn(actionInputsUtils, 'getActionInputs')
// const createCommentSpy = jest.spyOn(createCommentUtils, 'createComment')

// Mock the GitHub Actions github library
const github = {
  getOctokit: jest.fn().mockReturnValue({
    rest: {
      issues: {
        addLabels: jest.fn(),
        createComment: jest.fn().mockReturnValue({ data: { html_url: 'https://issues.closed' } }),
        listForRepo: jest.fn().mockReturnValue({ data: [{}] })
      }
    }
  }),
  context: {
    eventName: 'issues',
    repo: { owner: 'owner', repo: 'repo' },
    payload: {
      action: 'closed',
      issue: { number: 9, user: { login: 'ghosty' }, state_reason: '' }
    }
  }
} as unknown as typeof import('@actions/github')

describe('issues.opened', () => {
  it('handle when an issue is closed as completed', async () => {
    github.context.payload.issue!.state_reason = 'completed'

    await main.run(github)

    expect(isSupportedEventSpy).toHaveReturnedWith(true)
    // TODO: expect(isFirstTimeContributorSpy).toHaveReturnedWith(true)
    expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'completed' })
    expect(getActionInputsSpy).toHaveReturnedWith({
      labels: ['first timer'],
      msg: 'Issue has been completed!'
    })
    // TODO: expect(createCommentSpy).toHaveReturnedWith('https://issues.closed')
    // TODO: check add labels

    expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
    expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

    expect(runSpy).toHaveReturned()
  })

  it('handle when an issue is closed as not planned', async () => {
    github.context.payload.issue!.state_reason = 'not_planned'

    await main.run(github)

    expect(isSupportedEventSpy).toHaveReturnedWith(true)
    // TODO: expect(isFirstTimeContributorSpy).toHaveReturnedWith(true)
    expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'not-planned' })
    expect(getActionInputsSpy).toHaveReturnedWith({
      labels: ['first timer'],
      msg: 'This issue is not planned.'
    })
    // TODO: expect(createCommentSpy).toHaveReturnedWith('https://issues.closed')
    // TODO: check add labels

    expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
    expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

    expect(runSpy).toHaveReturned()
  })
})
