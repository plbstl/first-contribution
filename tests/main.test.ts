/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import { beforeEach, describe, expect, it, vitest } from 'vitest'
import * as main from '../src/main.ts'
import {
  isFirstTimeContributorSpy,
  isSupportedEventSpy,
  runSpy,
  setFailedSpyMock,
  setOutputSpyMock
} from './helpers.ts'
import { getOctokitMock, mockGithubContext, octokitListForRepoMock, resetMockGithubContext } from './setup.ts'

// Spy on (and mock) the GitHub Actions core library
vitest.spyOn(core, 'getInput').mockReturnValue('')

describe('action', () => {
  beforeEach(() => {
    resetMockGithubContext()
  })

  it('exits action when the triggered event is NOT supported', async () => {
    await main.run()

    expect(isSupportedEventSpy).toHaveReturnedWith(false)
    expect(getOctokitMock).not.toHaveBeenCalled()
  })

  it('exits action when the issue or pull request author is NOT a first-time contributor', async () => {
    mockGithubContext.eventName = 'issues'
    mockGithubContext.payload.action = 'opened'
    mockGithubContext.payload.issue = { number: 123, user: { login: 'ghosty' } }
    octokitListForRepoMock.mockReturnValue({ data: [{}, {}] })

    await main.run()

    expect(isFirstTimeContributorSpy).toHaveResolvedWith(false)
    expect(runSpy).toHaveResolvedWith(false)
  })

  it("sets the correct action's outputs for issues", async () => {
    // Supported event
    mockGithubContext.eventName = 'issues'
    mockGithubContext.payload.action = 'closed'
    mockGithubContext.payload.issue = { number: 16, user: { login: 'issue-ghosty' } }
    // Is first-time contributor
    octokitListForRepoMock.mockReturnValue({ data: [{ event: { state: 'opened' } }] })

    await main.run()

    expect(setOutputSpyMock).toHaveBeenCalledWith('comment-url', '')
    expect(setOutputSpyMock).toHaveBeenCalledWith('number', 16)
    expect(setOutputSpyMock).toHaveBeenCalledWith('type', 'issue')
    expect(setOutputSpyMock).toHaveBeenCalledWith('username', 'issue-ghosty')
    expect(runSpy).toHaveReturned()
  })

  it("sets the correct action's outputs for pull requests", async () => {
    // Supported event
    mockGithubContext.eventName = 'pull_request_target'
    mockGithubContext.payload.action = 'opened'
    mockGithubContext.payload.issue = undefined
    mockGithubContext.payload.pull_request = { number: 19, user: { login: 'pr-ghosty' } }
    // Is first-time contributor
    octokitListForRepoMock.mockReturnValue({ data: [{ event: { state: 'opened' }, pull_request: [{}] }] })

    await main.run()

    expect(setOutputSpyMock).toHaveBeenCalledWith('comment-url', '')
    expect(setOutputSpyMock).toHaveBeenCalledWith('number', 19)
    expect(setOutputSpyMock).toHaveBeenCalledWith('type', 'pr')
    expect(setOutputSpyMock).toHaveBeenCalledWith('username', 'pr-ghosty')
    expect(runSpy).toHaveReturned()
  })

  it('sets a failed status when an Error is thrown', async () => {
    isSupportedEventSpy.mockImplementation(() => {
      throw new Error('error message')
    })

    await main.run()

    expect(setFailedSpyMock).toHaveBeenCalledWith('error message')
    expect(runSpy).toHaveResolvedWith(true)
  })

  it('sets a failed status when something other than an Error is thrown', async () => {
    isSupportedEventSpy.mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 234
    })

    await main.run()

    expect(setFailedSpyMock).toHaveBeenCalledWith(expect.stringContaining('234'))
    expect(runSpy).toHaveResolvedWith(true)
  })
})
