/**
 * Unit tests for the action's `is_internal_contributor` util.
 */

import { describe, expect, it } from 'vitest'
import { is_internal_contributor } from '~src/utils/index.ts'
import { core_getBooleanInput_spy, octokit } from '~tests/helpers.ts'
import { octokit_checkCollaborator } from '~tests/setup.ts'

describe('is_internal_contributor()', () => {
  const default_opts = {
    creator: 'ghosty',
    owner: 'owner',
    repo: 'repo'
  }

  describe('`skip-internal-contributors` is enabled', () => {
    it('author is internal contributor', async () => {
      core_getBooleanInput_spy.mockImplementation(name => name === 'skip-internal-contributors')
      octokit_checkCollaborator.mockResolvedValue({ status: 204 })
      const result = await is_internal_contributor(octokit, default_opts)
      // should be skipped
      expect(result).toBe(true)
    })

    it('author is NOT internal contributor', async () => {
      core_getBooleanInput_spy.mockImplementation(name => name === 'skip-internal-contributors')
      octokit_checkCollaborator.mockResolvedValue({ status: 404 })
      const result = await is_internal_contributor(octokit, default_opts)
      // should NOT be skipped
      expect(result).toBe(false)
    })
  })

  describe('`skip-internal-contributors` is disabled', () => {
    it('author is internal contributor', async () => {
      core_getBooleanInput_spy.mockReturnValue(false)
      octokit_checkCollaborator.mockResolvedValue({ status: 204 })
      const result = await is_internal_contributor(octokit, default_opts)
      // should NOT be skipped
      expect(result).toBe(false)
    })

    it('author is NOT internal contributor', async () => {
      core_getBooleanInput_spy.mockReturnValue(false)
      octokit_checkCollaborator.mockResolvedValue({ status: 404 })
      const result = await is_internal_contributor(octokit, default_opts)
      // should NOT be skipped
      expect(result).toBe(false)
    })
  })
})
