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
  is_first_time_contributor_spy,
  is_supported_event_spy,
  run_spy,
  set_failed_spy_mock,
  set_output_spy_mock
} from './helpers.ts'
import { getOctokit_mock, mock_github_context, octokit_listForRepo_mock, reset_mock_github_context } from './setup.ts'

// Spy on (and mock) the GitHub Actions core library
vitest.spyOn(core, 'getInput').mockReturnValue('')

describe('action', () => {
  beforeEach(() => {
    reset_mock_github_context()
  })

  it('exits action when the triggered event is NOT supported', async () => {
    await main.run()

    expect(is_supported_event_spy).toHaveReturnedWith(false)
    expect(getOctokit_mock).not.toHaveBeenCalled()
  })

  it('exits action when the issue or pull request author is NOT a first-time contributor', async () => {
    mock_github_context.eventName = 'issues'
    mock_github_context.payload.action = 'opened'
    mock_github_context.payload.issue = { number: 123, user: { login: 'ghosty' } }
    octokit_listForRepo_mock.mockReturnValue({ data: [{}, {}] })

    await main.run()

    expect(is_first_time_contributor_spy).toHaveResolvedWith(false)
    expect(run_spy).toHaveResolvedWith(false)
  })

  it("sets the correct action's outputs for issues", async () => {
    // Supported event
    mock_github_context.eventName = 'issues'
    mock_github_context.payload.action = 'closed'
    mock_github_context.payload.issue = { number: 16, user: { login: 'issue-ghosty' } }
    // Is first-time contributor
    octokit_listForRepo_mock.mockReturnValue({ data: [{ event: { state: 'opened' } }] })

    await main.run()

    expect(set_output_spy_mock).toHaveBeenCalledWith('comment-url', '')
    expect(set_output_spy_mock).toHaveBeenCalledWith('number', 16)
    expect(set_output_spy_mock).toHaveBeenCalledWith('type', 'issue')
    expect(set_output_spy_mock).toHaveBeenCalledWith('username', 'issue-ghosty')
    expect(run_spy).toHaveReturned()
  })

  it("sets the correct action's outputs for pull requests", async () => {
    // Supported event
    mock_github_context.eventName = 'pull_request_target'
    mock_github_context.payload.action = 'opened'
    mock_github_context.payload.issue = undefined
    mock_github_context.payload.pull_request = { number: 19, user: { login: 'pr-ghosty' } }
    // Is first-time contributor
    octokit_listForRepo_mock.mockReturnValue({ data: [{ event: { state: 'opened' }, pull_request: [{}] }] })

    await main.run()

    expect(set_output_spy_mock).toHaveBeenCalledWith('comment-url', '')
    expect(set_output_spy_mock).toHaveBeenCalledWith('number', 19)
    expect(set_output_spy_mock).toHaveBeenCalledWith('type', 'pr')
    expect(set_output_spy_mock).toHaveBeenCalledWith('username', 'pr-ghosty')
    expect(run_spy).toHaveReturned()
  })

  it('sets a failed status when an Error is thrown', async () => {
    is_supported_event_spy.mockImplementation(() => {
      throw new Error('error message')
    })

    await main.run()

    expect(set_failed_spy_mock).toHaveBeenCalledWith('error message')
    expect(run_spy).toHaveResolvedWith(true)
  })

  it('sets a failed status when something other than an Error is thrown', async () => {
    is_supported_event_spy.mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 234
    })

    await main.run()

    expect(set_failed_spy_mock).toHaveBeenCalledWith(expect.stringContaining('234'))
    expect(run_spy).toHaveResolvedWith(true)
  })
})
