/**
 * Unit tests for the `issues` event.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import * as main from '../src/main.ts'
import {
  createdCommentUrl,
  generalAssertions,
  getActionInputsSpy,
  getFCEventSpy,
  issueCompletedMsg,
  issueLabels,
  issueNotPlannedMsg,
  issueOpenedMsg
} from './helpers.ts'
import { mockGithubContext, octokitCreateCommentMock, octokitListForRepoMock, resetMockGithubContext } from './setup.ts'

describe('issues', () => {
  beforeEach(() => {
    resetMockGithubContext()
  })

  describe('.opened', () => {
    it('handles when a new issue is opened', async () => {
      // Supported event
      mockGithubContext.eventName = 'issues'
      mockGithubContext.payload.action = 'opened'
      mockGithubContext.payload.issue = { number: 8, user: { login: 'ghosty' } }
      // Mock requests
      octokitListForRepoMock.mockReturnValue({ data: [{}] })
      octokitCreateCommentMock.mockReturnValue({ data: { html_url: createdCommentUrl } })

      await main.run()

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'opened' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [issueLabels],
        msg: issueOpenedMsg
      })

      generalAssertions({ addedLabel: true })
    })
  })

  describe('.closed', () => {
    it('handles when an issue is closed as completed', async () => {
      // Supported event
      mockGithubContext.eventName = 'issues'
      mockGithubContext.payload.action = 'closed'
      mockGithubContext.payload.issue = { number: 8, user: { login: 'ghosty' }, state_reason: 'completed' }
      // Mock requests
      octokitListForRepoMock.mockReturnValue({ data: [{}] })
      octokitCreateCommentMock.mockReturnValue({ data: { html_url: createdCommentUrl } })

      await main.run()

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'completed' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [issueLabels],
        msg: issueCompletedMsg
      })

      generalAssertions({ addedLabel: false })
    })

    it('handle when an issue is closed as not planned', async () => {
      // Supported event
      mockGithubContext.eventName = 'issues'
      mockGithubContext.payload.action = 'closed'
      mockGithubContext.payload.issue = { number: 8, user: { login: 'ghosty' }, state_reason: 'not_planned' }
      // Mock requests
      octokitListForRepoMock.mockReturnValue({ data: [{}] })
      octokitCreateCommentMock.mockReturnValue({ data: { html_url: createdCommentUrl } })

      await main.run()

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'not-planned' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [issueLabels],
        msg: issueNotPlannedMsg
      })

      generalAssertions({ addedLabel: false })
    })
  })
})
