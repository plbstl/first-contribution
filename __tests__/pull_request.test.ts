/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * Unit tests for the `pull_request` and `pull_request_target` events.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import * as utils from '../src/utils'

/** Number of action outputs */
const NUMBER_OF_OUTPUTS = 4

// Spy on the action's main function
const runSpy = jest.spyOn(main, 'run')

// Spy on the acton's utils
const isFirstTimeContributorSpy = jest.spyOn(utils, 'isFirstTimeContributor')
const isSupportedEventSpy = jest.spyOn(utils, 'isSupportedEvent')
const getFCEventSpy = jest.spyOn(utils, 'getFCEvent')
const getActionInputsSpy = jest.spyOn(utils, 'getActionInputs')
const createCommentSpy = jest.spyOn(utils, 'createComment')
const addLabelsSpy = jest.spyOn(utils, 'addLabels')

// Mock the GitHub Actions octokit client
const listForRepoMock = jest.fn()
const getOctokit = jest.fn().mockReturnValue({
  rest: {
    issues: {
      addLabels: jest.fn(),
      createComment: jest.fn().mockReturnValue({ data: { html_url: 'html_url.com' } }),
      listForRepo: listForRepoMock
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
  beforeEach(() => {
    listForRepoMock.mockReset()
  })

  describe('.opened', () => {
    it('handle when a new pull request is opened', async () => {
      listForRepoMock.mockReturnValue({ data: [{}] })
      const github = {
        getOctokit,
        context: {
          eventName: 'pull_request',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            action: 'opened',
            pull_request: { number: 8, user: { login: 'ghosty' } }
          }
        }
      } as never

      await main.run(github)

      expect(isSupportedEventSpy).toHaveReturnedWith(true)
      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'opened' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: ['first-contrib'],
        msg: 'Thank you for opening this pull request.'
      })

      expect(await isFirstTimeContributorSpy.mock.results[0].value)./* resolved value */ toBe(true)
      expect(await createCommentSpy.mock.results[0].value)./* resolved value */ toBe('html_url.com')
      expect(await addLabelsSpy.mock.results[0].value)./* resolved value */ toBe(true)

      expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
      expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

      expect(runSpy).toHaveReturned()
    })
  })

  describe('.closed', () => {
    it('handle when a pull request is merged', async () => {
      listForRepoMock.mockReturnValue({ data: [{ state: 'closed' }] })
      const github = {
        getOctokit,
        context: {
          eventName: 'pull_request',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            action: 'closed',
            pull_request: { number: 8, user: { login: 'ghosty' }, merged: true }
          }
        }
      } as never

      await main.run(github)

      expect(isSupportedEventSpy).toHaveReturnedWith(true)
      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'merged' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: ['first-contrib'],
        msg: 'This PR has been successfully merged!'
      })

      expect(await isFirstTimeContributorSpy.mock.results[0].value)./* resolved value */ toBe(true)
      expect(await createCommentSpy.mock.results[0].value)./* resolved value */ toBe('html_url.com')
      expect(await addLabelsSpy.mock.results[0].value)./* resolved value */ toBe(false)

      expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
      expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

      expect(runSpy).toHaveReturned()
    })

    it('handle when a pull request is closed WITHOUT being merged', async () => {
      listForRepoMock.mockReturnValue({ data: [{ state: 'closed' }] })
      const github = {
        getOctokit,
        context: {
          eventName: 'pull_request',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            action: 'closed',
            pull_request: { number: 9, user: { login: 'ghosty' }, merged: false }
          }
        }
      } as never

      await main.run(github)

      expect(isSupportedEventSpy).toHaveReturnedWith(true)
      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'closed' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: ['first-contrib'],
        msg: 'PR was closed. Will not be merged'
      })

      expect(await isFirstTimeContributorSpy.mock.results[0].value)./* resolved value */ toBe(true)
      expect(await createCommentSpy.mock.results[0].value)./* resolved value */ toBe('html_url.com')
      expect(await addLabelsSpy.mock.results[0].value)./* resolved value */ toBe(false)

      expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
      expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

      expect(runSpy).toHaveReturned()
    })
  })
})
