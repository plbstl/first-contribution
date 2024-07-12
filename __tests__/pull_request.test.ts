/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * Unit tests for the `pull_request` and `pull_request_target` events.
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

// Spy on the acton's utils
// const isFirstTimeContributorSpy = jest.spyOn(isFirstTimeContributorUtils, 'isFirstTimeContributor')
const isSupportedEventSpy = jest.spyOn(isSupportedEventUtils, 'isSupportedEvent')
const getFCEventSpy = jest.spyOn(fcEventUtils, 'getFCEvent')
const getActionInputsSpy = jest.spyOn(actionInputsUtils, 'getActionInputs')
// const createCommentSpy = jest.spyOn(createCommentUtils, 'createComment')

// Mock the GitHub Actions octokit client
const getOctokit = jest.fn().mockReturnValue({
  rest: {
    issues: {
      addLabels: jest.fn(),
      createComment: jest.fn().mockReturnValue({ data: { html_url: 'html_url.com' } }),
      listForRepo: jest.fn().mockReturnValue({ data: [{}] })
    }
  }
})

// Spy on and mock the GitHub Actions core library
const setOutputSpyMock = jest.spyOn(core, 'setOutput').mockImplementation()
const getInputSpyMock = jest.spyOn(core, 'getInput').mockImplementation(name => {
  switch (name) {
    case 'token':
      return '***'
    case 'pr-labels':
      return 'first-contrib'
    case 'pr-opened-msg':
      return 'Thank you for opening this pull request.'
    case 'pr-merged-msg':
      return 'This PR has been successfully merged!'
    case 'pr-closed-msg':
      return 'PR was closed. Will not be merged'
    default:
      return ''
  }
})

describe('pull_request', () => {
  describe('.opened', () => {
    it('handle when a new pull request is opened', async () => {
      const github = {
        getOctokit,
        context: {
          eventName: 'pull_request',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            action: 'opened',
            pull_request: { author_association: 'FIRST_TIME_CONTRIBUTOR', number: 8, user: { login: 'ghosty' } }
          }
        }
      } as never

      await main.run(github)

      expect(isSupportedEventSpy).toHaveReturnedWith(true)
      // TODO: expect(isFirstTimeContributorSpy).toHaveReturnedWith(true)
      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'opened' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: ['first-contrib'],
        msg: 'Thank you for opening this pull request.'
      })
      // TODO: expect(createCommentSpy).toHaveReturnedWith('https://pull_request.opened')
      // TODO: check add labels

      expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
      expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

      expect(runSpy).toHaveReturned()
    })
  })

  describe('.closed', () => {
    it('handle when a pull request is merged', async () => {
      const github = {
        getOctokit,
        context: {
          eventName: 'pull_request',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            action: 'closed',
            pull_request: {
              author_association: 'FIRST_TIME_CONTRIBUTOR',
              number: 8,
              user: { login: 'ghosty' },
              merged: true
            }
          }
        }
      } as never

      await main.run(github)

      expect(isSupportedEventSpy).toHaveReturnedWith(true)
      // TODO: expect(isFirstTimeContributorSpy).toHaveReturnedWith(true)
      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'merged' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: ['first-contrib'],
        msg: 'This PR has been successfully merged!'
      })
      // TODO: expect(createCommentSpy).toHaveReturnedWith('https://pull_request.closed')
      // TODO: check add labels

      expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
      expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

      expect(runSpy).toHaveReturned()
    })

    it('handle when a pull request is closed WITHOUT being merged', async () => {
      const github = {
        getOctokit,
        context: {
          eventName: 'pull_request',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            action: 'closed',
            pull_request: {
              author_association: 'FIRST_TIME_CONTRIBUTOR',
              number: 9,
              user: { login: 'ghosty' },
              merged: false
            }
          }
        }
      } as never

      await main.run(github)

      expect(isSupportedEventSpy).toHaveReturnedWith(true)
      // TODO: expect(isFirstTimeContributorSpy).toHaveReturnedWith(true)
      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'closed' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: ['first-contrib'],
        msg: 'PR was closed. Will not be merged'
      })
      // TODO: expect(createCommentSpy).toHaveReturnedWith('https://pull_request.closed')
      // TODO: check add labels

      expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
      expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

      expect(runSpy).toHaveReturned()
    })
  })
})
