/**
 * Unit tests for the `issues` event.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import * as main from '../src/main'
import {
  generalAssertions,
  getActionInputsSpy,
  getFCEventSpy,
  githubIssueClosed,
  githubIssueOpened,
  issueCompletedMsg,
  issueLabels,
  issueNotPlannedMsg,
  issueOpenedMsg,
  listForRepoMock
} from './helpers'

describe('issues', () => {
  beforeEach(() => {
    listForRepoMock.mockReset()
  })

  describe('.opened', () => {
    it('handle when a new issue is opened', async () => {
      const github = githubIssueOpened({ isPullRequest: false })
      await main.run(github)

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'opened' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [issueLabels],
        msg: issueOpenedMsg
      })

      await generalAssertions({ addedLabel: true })
    })
  })

  describe('.closed', () => {
    it('handle when an issue is closed as completed', async () => {
      const github = githubIssueClosed({ isPullRequest: false, state_reason: 'completed' })
      await main.run(github)

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'completed' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [issueLabels],
        msg: issueCompletedMsg
      })

      await generalAssertions({ addedLabel: false })
    })

    it('handle when an issue is closed as not planned', async () => {
      const github = githubIssueClosed({ isPullRequest: false, state_reason: 'not_planned' })
      await main.run(github)

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'issue', state: 'not-planned' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [issueLabels],
        msg: issueNotPlannedMsg
      })

      await generalAssertions({ addedLabel: false })
    })
  })
})
