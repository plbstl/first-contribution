/**
 * Unit tests for the action's `get_action_inputs` util.
 */

import { describe, expect, it } from 'vitest'
import { get_action_inputs } from '~src/utils/index.ts'
import { core_getInput_spy_mock } from '~tests/helpers.ts'

describe('get_action_inputs()', () => {
  describe('.labels', () => {
    it('returns the correct labels for `-labels` inputs', () => {
      // Mock return values from core.getInput()
      core_getInput_spy_mock.mockImplementation(name => {
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

      // Issue
      const { labels: issue_labels } = get_action_inputs({ name: 'issue', state: 'opened' })
      expect(issue_labels).toEqual(['first-timer'])

      // Pull Request
      const { labels: pull_request_labels } = get_action_inputs({ name: 'pr', state: 'opened' })
      expect(pull_request_labels).toEqual(['label1', 'label2', 'label3', 'spaced     label4'])
    })

    it('returns fallback (if any) when a specific `-labels` input is unavailable', () => {
      // Mock return values from core.getInput()
      core_getInput_spy_mock.mockImplementation(name => {
        return name === 'labels' ? 'first-time contributor, first-interaction' : ''
      })

      // Issue
      const { labels: issue_labels } = get_action_inputs({ name: 'issue', state: 'opened' })
      expect(issue_labels).toEqual(['first-time contributor', 'first-interaction'])

      // Pull Request
      const { labels: pull_request_labels } = get_action_inputs({ name: 'pr', state: 'opened' })
      expect(pull_request_labels).toEqual(['first-time contributor', 'first-interaction'])
    })

    it('returns an empty array when no `-labels` input is provided', () => {
      // Mock return values from core.getInput()
      core_getInput_spy_mock.mockReturnValue('')

      // Issue
      const { labels: issue_labels } = get_action_inputs({ name: 'issue', state: 'opened' })
      expect(issue_labels).toEqual([])

      // Pull Request
      const { labels: pull_request_labels } = get_action_inputs({ name: 'pr', state: 'opened' })
      expect(pull_request_labels).toEqual([])
    })
  })

  describe('.msg', () => {
    it('returns the correct messages for all `-msg` inputs', () => {
      // Mock return values from core.getInput()
      core_getInput_spy_mock.mockImplementation(name => {
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
      const { msg: issue_opened_msg } = get_action_inputs({ name: 'issue', state: 'opened' })
      expect(issue_opened_msg).toMatch('Issue opened message')

      const { msg: issue_completed_msg } = get_action_inputs({ name: 'issue', state: 'completed' })
      expect(issue_completed_msg).toMatch('Issue completed message')

      const { msg: issue_not_planned_msg } = get_action_inputs({ name: 'issue', state: 'not-planned' })
      expect(issue_not_planned_msg).toMatch('Issue not planned message')

      // Pull Requests
      const { msg: pull_request_opened_msg } = get_action_inputs({ name: 'pr', state: 'opened' })
      expect(pull_request_opened_msg).toMatch('PR opened message')

      const { msg: pull_request_merged_msg } = get_action_inputs({ name: 'pr', state: 'merged' })
      expect(pull_request_merged_msg).toMatch('PR merged message')

      const { msg: pull_request_closed_msg } = get_action_inputs({ name: 'pr', state: 'closed' })
      expect(pull_request_closed_msg).toMatch('PR closed message')
    })

    it("returns a correct message when `-msg` input is 'symlinked'", () => {
      // Mock return values from core.getInput()
      core_getInput_spy_mock.mockImplementation(name => {
        switch (name) {
          case 'issue-completed-msg':
            return 'Issue completed message'
          case 'pr-merged-msg':
            return 'issue-completed-msg'
          default:
            return ''
        }
      })

      const { msg: pull_request_merged_msg } = get_action_inputs({ name: 'pr', state: 'merged' })
      expect(pull_request_merged_msg).toMatch('Issue completed message')
    })

    it('trims leading/trailing whitespace and line terminator characters in `-msg` inputs', () => {
      // Mock return values from core.getInput()
      core_getInput_spy_mock.mockImplementation(name => {
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

      const { msg: issue_opened_msg } = get_action_inputs({ name: 'issue', state: 'opened' })
      expect(issue_opened_msg).toMatch('')

      const { msg: pull_request_opened_msg } = get_action_inputs({ name: 'pr', state: 'opened' })
      expect(pull_request_opened_msg).toMatch('')

      const { msg: pull_request_merged_msg } = get_action_inputs({ name: 'pr', state: 'merged' })
      expect(pull_request_merged_msg).toMatch('o p')

      const { msg: pull_request_closed_msg } = get_action_inputs({ name: 'pr', state: 'closed' })
      expect(pull_request_closed_msg).toMatch('- -     -')
    })
  })

  describe('.reactions', () => {
    //  `+1`, `-1`, `laugh`, `confused`, `heart`, `hooray`, `rocket`, `eyes`

    it('returns the correct values for `-reactions` inputs', () => {
      // Mock return values from core.getInput()
      core_getInput_spy_mock.mockImplementation(name => {
        switch (name) {
          case 'reactions':
            return '+1, -1, laugh, confused, heart, hooray'
          case 'issue-reactions':
            return 'eyes,      +1,       heart'
          case 'pr-reactions':
            return 'hooray,            rocket,   '
          default:
            return ''
        }
      })

      // Issue
      const { reactions: issue_reactions } = get_action_inputs({ name: 'issue', state: 'opened' })
      expect(issue_reactions).toEqual(['eyes', '+1', 'heart'])

      // Pull Request
      const { reactions: pull_request_reactions } = get_action_inputs({ name: 'pr', state: 'opened' })
      expect(pull_request_reactions).toEqual(['hooray', 'rocket', ''])
    })

    it('returns fallback (if any) when a specific `-reactions` input is unavailable', () => {
      // Mock return values from core.getInput()
      core_getInput_spy_mock.mockImplementation(name => {
        return name === 'reactions' ? '+1, , laugh,  hooray' : ''
      })

      // Issue
      const { reactions: issue_reactions } = get_action_inputs({ name: 'issue', state: 'opened' })
      expect(issue_reactions).toEqual(['+1', '', 'laugh', 'hooray'])

      // Pull Request
      const { reactions: pull_request_reactions } = get_action_inputs({ name: 'pr', state: 'opened' })
      expect(pull_request_reactions).toEqual(['+1', '', 'laugh', 'hooray'])
    })

    it('returns an empty array when no `-reactions` input is provided', () => {
      // Mock return values from core.getInput()
      core_getInput_spy_mock.mockReturnValue('')

      // Issue
      const { reactions: issue_reactions } = get_action_inputs({ name: 'issue', state: 'opened' })
      expect(issue_reactions).toEqual([])

      // Pull Request
      const { reactions: pull_request_reactions } = get_action_inputs({ name: 'pr', state: 'opened' })
      expect(pull_request_reactions).toEqual([])
    })
  })
})
