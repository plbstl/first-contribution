/**
 * Unit tests for retrieving categorize action inputs.
 */

import * as core from '@actions/core'
import { getActionInputs } from '../src/utils/action-inputs'

// Spy on the GitHub Actions core library
const getInputSpy = jest.spyOn(core, 'getInput')

describe('getActionInputs()', () => {
  describe('.labels', () => {
    it('return the correct labels for `-labels` inputs', () => {
      // Set the action's inputs as return values from core.getInput()
      getInputSpy.mockImplementation(name => {
        switch (name) {
          case 'labels':
            return 'first-time contributor'
          case 'issue-labels':
            return 'first-timer'
          case 'pr-labels':
            return 'label1, label2,label3,      spaced     label4'
          default:
            return ''
        }
      })

      // Issue - `state` is not used
      const { labels: issueLabels } = getActionInputs({ name: 'issue', state: 'opened' })
      expect(issueLabels).toEqual(['first-timer'])

      // Pull Request - `state` is not used
      const { labels: pullRequestLabels } = getActionInputs({ name: 'pr', state: 'opened' })
      expect(pullRequestLabels).toEqual(['label1', 'label2', 'label3', 'spaced     label4'])
    })

    it('return fallback (if any) when a specific `-labels` input is unavailable', () => {
      // Set the action's inputs as return values from core.getInput()
      getInputSpy.mockImplementation(name => {
        return name === 'labels' ? 'first-time contributor, first-interaction' : ''
      })

      // Issue - `state` is not used
      const { labels: issueLabels } = getActionInputs({ name: 'issue', state: 'opened' })
      expect(issueLabels).toEqual(['first-time contributor', 'first-interaction'])

      // Pull Request - `state` is not used
      const { labels: pullRequestLabels } = getActionInputs({ name: 'pr', state: 'opened' })
      expect(pullRequestLabels).toEqual(['first-time contributor', 'first-interaction'])
    })

    it('return an empty array when no `-labels` input is provided', () => {
      // Set the action's inputs as return values from core.getInput()
      getInputSpy.mockReturnValue('')

      // Issue - `state` is not used
      const { labels: issueLabels } = getActionInputs({ name: 'issue', state: 'opened' })
      expect(issueLabels).toEqual([])

      // Pull Request - `state` is not used
      const { labels: pullRequestLabels } = getActionInputs({ name: 'pr', state: 'opened' })
      expect(pullRequestLabels).toEqual([])
    })
  })

  describe('.msg', () => {
    it('return the correct messages for `-msg` inputs', () => {
      // Testing all `-msg` inputs as they should be changed meticulously
      getInputSpy.mockImplementation(name => {
        switch (name) {
          // Issues
          case 'issue-opened-msg':
            return 'Issue opened message'
          case 'issue-completed-msg':
            return 'Issue completed message'
          case 'issue-not-planned-msg':
            return 'Issue not planned message'
          // Pull Requests
          case 'pr-opened-msg':
            return 'PR opened message'
          case 'pr-merged-msg':
            return 'PR merged message'
          case 'pr-closed-msg':
            return 'PR closed message'

          default:
            return ''
        }
      })

      // Issues
      const { msg: issueOpenedMsg } = getActionInputs({ name: 'issue', state: 'opened' })
      expect(issueOpenedMsg).toMatch('Issue opened message')

      const { msg: issueCompletedMsg } = getActionInputs({ name: 'issue', state: 'completed' })
      expect(issueCompletedMsg).toMatch('Issue completed message')

      const { msg: issueNotPlannedMsg } = getActionInputs({ name: 'issue', state: 'not-planned' })
      expect(issueNotPlannedMsg).toMatch('Issue not planned message')

      // Pull Requests
      const { msg: pullRequestOpenedMsg } = getActionInputs({ name: 'pr', state: 'opened' })
      expect(pullRequestOpenedMsg).toMatch('PR opened message')

      const { msg: pullRequestMergedMsg } = getActionInputs({ name: 'pr', state: 'merged' })
      expect(pullRequestMergedMsg).toMatch('PR merged message')

      const { msg: pullRequestClosedMsg } = getActionInputs({ name: 'pr', state: 'closed' })
      expect(pullRequestClosedMsg).toMatch('PR closed message')
    })

    it("return a correct message when `-msg` input is 'symlinked'", () => {
      // Set the action's inputs as return values from core.getInput()
      getInputSpy.mockImplementation(name => {
        switch (name) {
          case 'issue-completed-msg':
            return 'Issue completed message'
          case 'pr-merged-msg':
            return 'issue-completed-msg'
          default:
            return ''
        }
      })

      const { msg: pullRequestMergedMsg } = getActionInputs({ name: 'pr', state: 'merged' })
      expect(pullRequestMergedMsg).toMatch('Issue completed message')
    })

    it('trim leading/trailing whitespace and line terminator characters in `-msg` inputs', () => {
      // Set the action's inputs as return values from core.getInput()
      getInputSpy.mockImplementation(name => {
        switch (name) {
          case 'issue-opened-msg':
            return '      '
          case 'pr-opened-msg':
            return '\n\n\n\n\n\n\n\n'
          case 'pr-merged-msg':
            return '  \n\n\no p    \n  \n  \n '
          case 'pr-closed-msg':
            return '        - -     -  '
          default:
            return ''
        }
      })

      const { msg: issueOpenedMsg } = getActionInputs({ name: 'issue', state: 'opened' })
      expect(issueOpenedMsg).toMatch('')

      const { msg: pullRequestOpenedMsg } = getActionInputs({ name: 'pr', state: 'opened' })
      expect(pullRequestOpenedMsg).toMatch('')

      const { msg: pullRequestMergedMsg } = getActionInputs({ name: 'pr', state: 'merged' })
      expect(pullRequestMergedMsg).toMatch('o p')

      const { msg: pullRequestClosedMsg } = getActionInputs({ name: 'pr', state: 'closed' })
      expect(pullRequestClosedMsg).toMatch('- -     -')
    })
  })
})
