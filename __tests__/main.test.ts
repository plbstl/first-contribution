/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import * as actionInputsUtils from '../src/utils/action-inputs'
import * as helperUtils from '../src/utils/helpers'

// Spy on the action's main function
const runSpy = jest.spyOn(main, 'run')

// Spy on the GitHub Actions core library
const getInputSpy = jest.spyOn(core, 'getInput')
const setOutputSpy = jest.spyOn(core, 'setOutput')

// Spy on the acton's utils
const getActionInputsSpyMock = jest.spyOn(actionInputsUtils, 'getActionInputs')
const isFirstTimeContributorSpy = jest.spyOn(helperUtils, 'isFirstTimeContributor')
const isSupportedEventSpy = jest.spyOn(helperUtils, 'isSupportedEvent')

describe('first-contribution GitHub Action', () => {
  it('exit action when the triggered event is NOT supported', async () => {
    isSupportedEventSpy.mockReturnValue(false)

    await main.run()

    expect(isSupportedEventSpy).toHaveBeenCalled()
    expect(isFirstTimeContributorSpy).not.toHaveBeenCalled()
    expect(getActionInputsSpyMock).not.toHaveBeenCalled()
    expect(setOutputSpy).not.toHaveBeenCalled()
    expect(runSpy).toHaveReturned()
  })

  it('exit action when the issue or pull request author is NOT a first-time contributor', async () => {
    isSupportedEventSpy.mockReturnValue(true)
    getInputSpy.mockReturnValue('***')
    isFirstTimeContributorSpy.mockReturnValue(new Promise(resolve => resolve(false)))

    await main.run()

    expect(isFirstTimeContributorSpy).toHaveBeenCalled()
    expect(getActionInputsSpyMock).not.toHaveBeenCalled()
    expect(setOutputSpy).not.toHaveBeenCalled()
    expect(runSpy).toHaveReturned()
  })

  it("correctly set the action's outputs", async () => {
    isSupportedEventSpy.mockReturnValue(true)
    isFirstTimeContributorSpy.mockReturnValue(new Promise(resolve => resolve(true)))
    getActionInputsSpyMock.mockReturnValue({ labels: [], msg: 'Random message' })
    setOutputSpy.mockImplementation()

    // Mock the GitHub Actions github library
    const github = {
      getOctokit: jest.fn().mockReturnValue({
        rest: {
          issues: {
            createComment: jest.fn().mockReturnValue({ data: { html_url: 'commentUrl' } })
          }
        }
      }),
      context: {
        repo: { owner: 'owner', repo: 'repo' },
        payload: {
          issue: {
            number: 13,
            user: { login: 'ghosty' }
          }
        }
      }
    } as unknown as typeof import('@actions/github')

    await main.run(github)

    expect(setOutputSpy).toHaveBeenCalledWith('comment-url', 'commentUrl')
    expect(setOutputSpy).toHaveBeenCalledWith('id', 13)
    expect(setOutputSpy).toHaveBeenCalledWith('type', 'issue')
    expect(setOutputSpy).toHaveBeenCalledWith('username', 'ghosty')
    expect(runSpy).toHaveReturned()
  })

  // Check for supported events:
  // 'issues.opened',
  // 'issues.closed',
  // 'pull_request.opened',
  // 'pull_request.closed',
  // 'pull_request_target.opened',
  // 'pull_request_target.closed'

  // Check for correct outputs
})
