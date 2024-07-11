/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as main from '../src/main'

describe('action', () => {
  it('runs action', async () => {
    const runMock = jest.spyOn(main, 'run')
    await main.run()
    expect(runMock).toHaveReturned()
  })
})
