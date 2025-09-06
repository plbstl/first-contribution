/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { describe, expect, it, vitest } from 'vitest'
import * as main from '../src/main.ts'

// Mock the action's entrypoint
const runMock = vitest.spyOn(main, 'run').mockReturnValue(Promise.resolve())

describe('index', () => {
  it('calls run when imported', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../src/index.ts')

    expect(runMock).toHaveBeenCalled()
  })
})
