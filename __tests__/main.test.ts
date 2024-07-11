/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as main from '../src/main'

describe('first-contribution GitHub Action', () => {
  // Check if unsupported event
  // Check if octokit is call with correct token

  // Check for supported events:
  // 'issues.opened',
  // 'issues.closed',
  // 'pull_request.opened',
  // 'pull_request.closed',
  // 'pull_request_target.opened',
  // 'pull_request_target.closed'

  // Check for correct outputs

  it('runs action', async () => {
    const runMock = jest.spyOn(main, 'run')
    await main.run()
    expect(runMock).toHaveReturned()
  })
})
