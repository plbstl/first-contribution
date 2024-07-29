/**
 * Unit tests for the `issues` event.
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
    case 'issue-labels':
      return 'first timer'
    case 'issue-opened-msg':
      return 'Thank you for reporting this issue.'
    case 'issue-completed-msg':
      return 'Issue has been completed!'
    case 'issue-not-planned-msg':
      return 'pr-closed-msg'
    default:
      return ''
  }
})

describe('issues', () => {
  beforeEach(() => {
    listForRepoMock.mockReset()
  })

  describe('.opened', () => {
    it('handle when a new issue is opened', async () => {
      listForRepoMock.mockReturnValue({ data: [{}] })
      const github = {
        getOctokit,
        context: {
          eventName: 'issues',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            action: 'opened',
            issue: { number: 8, user: { login: 'ghosty' } }
          }
        }
      } as never

      await main.run(github)

      expect(isSupportedEventSpy).toHaveReturnedWith(true)
      expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'opened' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: ['first timer'],
        msg: 'Thank you for reporting this issue.'
      })

      expect(await isFirstTimeContributorSpy.mock.results[0].value)./* resolved value */ toBe(true)
      expect(await createCommentSpy.mock.results[0].value)./* resolved value */ toBe('html_url.com')
      expect(await addLabelsSpy.mock.results[0].value)./* resolved value */ toBe(true)

      expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'issue-labels', 'issue-opened-msg'].length)
      expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

      expect(runSpy).toHaveReturned()
    })
  })

  describe('.closed', () => {
    it('handle when an issue is closed as completed', async () => {
      listForRepoMock.mockReturnValue({ data: [{ state: 'closed' }] })
      const github = {
        getOctokit,
        context: {
          eventName: 'issues',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            action: 'closed',
            issue: { number: 9, user: { login: 'ghosty' }, state_reason: 'completed' }
          }
        }
      } as never

      await main.run(github)

      expect(isSupportedEventSpy).toHaveReturnedWith(true)
      expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'completed' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: ['first timer'],
        msg: 'Issue has been completed!'
      })

      expect(await isFirstTimeContributorSpy.mock.results[0].value)./* resolved value */ toBe(true)
      expect(await createCommentSpy.mock.results[0].value)./* resolved value */ toBe('html_url.com')
      expect(await addLabelsSpy.mock.results[0].value)./* resolved value */ toBe(false)

      expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg'].length)
      expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

      expect(runSpy).toHaveReturned()
    })

    it('handle when an issue is closed as not planned', async () => {
      listForRepoMock.mockReturnValue({ data: [{ state: 'closed' }] })
      const github = {
        getOctokit,
        context: {
          eventName: 'issues',
          repo: { owner: 'owner', repo: 'repo' },
          payload: {
            action: 'closed',
            issue: { number: 9, user: { login: 'ghosty' }, state_reason: 'not_planned' }
          }
        }
      } as never

      await main.run(github)

      expect(isSupportedEventSpy).toHaveReturnedWith(true)
      expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'not-planned' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: ['first timer'],
        msg: ''
      })

      expect(await isFirstTimeContributorSpy.mock.results[0].value)./* resolved value */ toBe(true)
      expect(await createCommentSpy.mock.results[0].value)./* resolved value */ toBe('')
      expect(await addLabelsSpy.mock.results[0].value)./* resolved value */ toBe(false)

      expect(getInputSpyMock).toHaveBeenCalledTimes(['token', 'labels', 'msg', 'msg-symlink'].length)
      expect(setOutputSpyMock).toHaveBeenCalledTimes(NUMBER_OF_OUTPUTS)

      expect(runSpy).toHaveReturned()
    })
  })
})
