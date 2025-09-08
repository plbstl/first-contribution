/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { describe, expect, it, vitest } from 'vitest'
import * as main from '../src/main.ts'

// Mock the action's entrypoint
const run_mock = vitest.spyOn(main, 'run').mockReturnValue(Promise.resolve(false))

describe('index', () => {
  it('calls run when imported', async () => {
    await import('../src/index.ts')

    expect(run_mock).toHaveBeenCalled()
  })
})
