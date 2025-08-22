/**
 * Unit tests for the `pull_request` and `pull_request_target` events.
 */

import * as main from '../src/main'
import {
  generalAssertions,
  getActionInputsSpy,
  getFCEventSpy,
  githubIssueClosed,
  githubIssueOpened,
  listForRepoMock,
  prClosedMsg,
  prLabels,
  prMergedMsg,
  prOpenedMsg
} from './helpers'

describe('pull_request', () => {
  beforeEach(() => {
    listForRepoMock.mockReset()
  })

  describe('.opened', () => {
    it('handle when a new pull request is opened', async () => {
      const github = githubIssueOpened({ isPullRequest: true })
      await main.run(github)

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'opened' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [prLabels],
        msg: prOpenedMsg
      })

      await generalAssertions({ addedLabel: true })
    })
  })

  describe('.closed', () => {
    it('handle when a pull request is merged', async () => {
      const github = githubIssueClosed({ isPullRequest: true, merged: true })
      await main.run(github)

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'merged' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [prLabels],
        msg: prMergedMsg
      })

      await generalAssertions({ addedLabel: false })
    })

    it('handle when a pull request is closed WITHOUT being merged', async () => {
      const github = githubIssueClosed({ isPullRequest: true, merged: false })
      await main.run(github)

      expect(getFCEventSpy).toHaveReturnedWith({ name: 'pr', state: 'closed' })
      expect(getActionInputsSpy).toHaveReturnedWith({
        labels: [prLabels],
        msg: prClosedMsg
      })

      await generalAssertions({ addedLabel: false })
    })
  })
})
