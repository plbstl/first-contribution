/**
 * Unit tests for the action's `is_internal_contributor` util.
 */

import { describe, expect, it } from 'vitest'
import { is_internal_contributor } from '~src/utils/index.ts'
import { core_getBooleanInput_spy, not_a_collaborator, octokit } from '~tests/helpers.ts'
import { octokit_checkCollaborator, octokit_checkMembershipForUser } from '~tests/setup.ts'

describe('is_internal_contributor()', () => {
  const default_opts = {
    author: 'ghosty',
    owner: 'owner',
    repo: 'repo'
  }

  const pat_token = '***'

  describe('`skip-internal-contributors` is enabled', () => {
    it('author is internal contributor', async () => {
      core_getBooleanInput_spy.mockImplementation(name => name === 'skip-internal-contributors')
      octokit_checkMembershipForUser.mockResolvedValue({ status: 204 })

      const result = await is_internal_contributor(octokit, pat_token, default_opts)
      // should be skipped
      expect(result).toBe(true)
    })

    it('author is NOT internal contributor', async () => {
      core_getBooleanInput_spy.mockImplementation(name => name === 'skip-internal-contributors')
      octokit_checkMembershipForUser.mockImplementation(not_a_collaborator)
      octokit_checkCollaborator.mockImplementation(not_a_collaborator)

      const result = await is_internal_contributor(octokit, pat_token, default_opts)
      // should NOT be skipped
      expect(result).toBe(false)
    })

    it('author is NOT org member but IS repo collaborator', async () => {
      core_getBooleanInput_spy.mockImplementation(name => name === 'skip-internal-contributors')
      octokit_checkMembershipForUser.mockImplementation(not_a_collaborator)
      octokit_checkCollaborator.mockResolvedValue({ status: 204 })

      const result = await is_internal_contributor(octokit, pat_token, default_opts)

      // should be skipped
      expect(result).toBe(true)
    })
  })

  describe('`skip-internal-contributors` is disabled', () => {
    it('author is internal contributor', async () => {
      core_getBooleanInput_spy.mockReturnValue(false)
      octokit_checkMembershipForUser.mockResolvedValue({ status: 204 })

      const result = await is_internal_contributor(octokit, pat_token, default_opts)
      // should NOT be skipped
      expect(result).toBe(false)
    })

    it('author is NOT internal contributor', async () => {
      core_getBooleanInput_spy.mockReturnValue(false)
      octokit_checkMembershipForUser.mockImplementation(not_a_collaborator)
      octokit_checkCollaborator.mockImplementation(not_a_collaborator)

      const result = await is_internal_contributor(octokit, pat_token, default_opts)
      // should NOT be skipped
      expect(result).toBe(false)
    })

    it('author is NOT org member but IS repo collaborator', async () => {
      core_getBooleanInput_spy.mockReturnValue(false)
      octokit_checkMembershipForUser.mockImplementation(not_a_collaborator)
      octokit_checkCollaborator.mockResolvedValue({ status: 204 })

      const result = await is_internal_contributor(octokit, pat_token, default_opts)

      // should NOT be skipped
      expect(result).toBe(false)
    })
  })

  it('rethrows error if org check fails with non-404', async () => {
    core_getBooleanInput_spy.mockReturnValue(true)
    octokit_checkMembershipForUser.mockImplementation(() => {
      throw new Error('Boom')
    })

    const result = is_internal_contributor(octokit, pat_token, default_opts)

    await expect(result).rejects.toThrow('Boom')
  })

  it('rethrows error if collaborator check fails with non-404', async () => {
    core_getBooleanInput_spy.mockReturnValue(false)
    octokit_checkMembershipForUser.mockImplementation(not_a_collaborator)
    octokit_checkCollaborator.mockImplementation(() => {
      throw new Error('Something')
    })

    const result = is_internal_contributor(octokit, pat_token, default_opts)

    await expect(result).rejects.toThrow('Something')
  })
})
