/**
 * Unit tests for the `pull_request` and `pull_request_target` events.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import * as main from '../src/main.ts'
import {
  createdCommentUrl,
  generalAssertions,
  getActionInputsSpy,
  getFCEventSpy,
  prClosedMsg,
  prLabels,
  prMergedMsg,
  prOpenedMsg
} from './helpers.ts'
import { mockGithubContext, octokitCreateCommentMock, octokitListForRepoMock, resetMockGithubContext } from './setup.ts'

describe('pull_request', () => {
  beforeEach(() => {
    resetMockGithubContext()
  })

  describe('.opened', () => {
    // Mock requests
    octokitListForRepoMock.mockReturnValue({ data: [{ pull_request: [{}] }] })
    octokitCreateCommentMock.mockReturnValue({ data: { html_url: createdCommentUrl } })

    it('handles when a new pull request is opened', async () => {
      // Supported event
      mockGithubContext.eventName = 'pull_request_target'
      mockGithubContext.payload.action = 'opened'
      mockGithubContext.payload.pull_request = { number: 4, user: { login: 'randy' } }

      await main.run()

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'opened' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [prLabels],
        msg: prOpenedMsg
      })

      generalAssertions({ addedLabel: true })
    })
  })

  describe('.closed', () => {
    it('handles when a pull request is merged', async () => {
      // Supported event
      mockGithubContext.eventName = 'pull_request_target'
      mockGithubContext.payload.action = 'closed'
      mockGithubContext.payload.pull_request = { number: 4, user: { login: 'randy' }, merged: true }

      await main.run()

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'merged' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [prLabels],
        msg: prMergedMsg
      })

      generalAssertions({ addedLabel: false })
    })

    it('handles when a pull request is closed WITHOUT being merged', async () => {
      // Supported event
      mockGithubContext.eventName = 'pull_request_target'
      mockGithubContext.payload.action = 'closed'
      mockGithubContext.payload.pull_request = { number: 4, user: { login: 'randy' }, merged: false }
      // Mock requests
      octokitListForRepoMock.mockReturnValue({ data: [{ pull_request: [{}] }] })
      octokitCreateCommentMock.mockReturnValue({ data: { html_url: createdCommentUrl } })

      await main.run()

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'closed' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [prLabels],
        msg: prClosedMsg
      })

      generalAssertions({ addedLabel: false })
    })
  })
})
