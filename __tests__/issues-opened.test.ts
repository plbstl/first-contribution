/**
 * Unit tests for the `issues.opened` event.
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
    case 'issue-opened-msg':
      return 'Thank you for reporting this issue.'
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
        createComment: jest.fn().mockReturnValue({ data: { html_url: 'https://issues.opened' } }),
        listForRepo: jest.fn().mockReturnValue({ data: [{}] })
      }
    }
  }),
  context: {
    eventName: 'issues',
    repo: { owner: 'owner', repo: 'repo' },
    payload: {
      action: 'opened',
      issue: { number: 8, user: { login: 'ghosty' } }
    }
  }
} as unknown as typeof import('@actions/github')

describe('issues.opened', () => {
  it('correctly handle `issues.opened` event', async () => {
    await main.run(github)

    expect(isSupportedEventSpy).toHaveReturnedWith(true)
    // TODO: expect(isFirstTimeContributorSpy).toHaveReturnedWith(true)
    expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'opened' })
    expect(getActionInputsSpy).toHaveReturnedWith({
      labels: ['first timer'],
      msg: 'Thank you for reporting this issue.'
    })
    // TODO: expect(createCommentSpy).toHaveReturnedWith('https://issues.opened')
    // TODO: check add labels

    expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'issue-labels', 'issue-opened-msg'].length)
    expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

    expect(runSpy).toHaveReturned()
  })
})
