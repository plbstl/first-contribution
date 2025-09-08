/**
 * Unit tests for the action's `is_first_time_contributor` util.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { is_first_time_contributor } from '~src/utils/index.ts'
import { core_getInput_spy_mock, is_first_time_contributor_spy, octokit } from '~tests/helpers.ts'
import { octokit_listCommits_mock, octokit_listForRepo_mock } from '~tests/setup.ts'

describe('is_first_time_contributor()', () => {
  const default_opts = {
    creator: 'ghosty',
    owner: 'owner',
    repo: 'repo'
  }

  describe('when checking for prior commits', () => {
    it('returns false immediately if the user has a commit history', async () => {
      octokit_listCommits_mock.mockResolvedValue({ data: [{ sha: 'commit-sha-123' }] })

      const result = await is_first_time_contributor(octokit, {
        ...default_opts,
        is_pull_request: false
      })

      expect(result).toBe(false)
      expect(octokit_listCommits_mock).toHaveBeenCalledWith(expect.objectContaining({ author: default_opts.creator }))
      expect(octokit_listForRepo_mock).not.toHaveBeenCalled()
    })

    it('proceeds to check issues/PRs if the user has no commit history', async () => {
      octokit_listCommits_mock.mockResolvedValue({ data: [] })
      octokit_listForRepo_mock.mockResolvedValue({ data: [{}] })

      const result = await is_first_time_contributor(octokit, {
        ...default_opts,
        is_pull_request: false
      })

      expect(result).toBe(true)
      expect(octokit_listCommits_mock).toHaveBeenCalled()
      expect(octokit_listForRepo_mock).toHaveBeenCalledWith(expect.objectContaining({ creator: default_opts.creator }))
    })
  })

  describe('contribution-mode = once', () => {
    beforeEach(() => {
      // Ensure no commits are found for these tests
      octokit_listCommits_mock.mockResolvedValue({ data: [] })
      core_getInput_spy_mock.mockReturnValue('once')
    })

    it('returns true if the user has only one contribution (issue or PR)', async () => {
      octokit_listForRepo_mock.mockReturnValue({ data: [{}] })

      await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

      expect(is_first_time_contributor_spy).toHaveResolvedWith(true)
    })

    it('returns false if the user has multiple contributions', async () => {
      octokit_listForRepo_mock.mockReturnValue({ data: [{}, { pull_request: {} }] })

      await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

      expect(is_first_time_contributor_spy).toHaveResolvedWith(false)
    })
  })

  describe('contribution-mode = (default)', () => {
    beforeEach(() => {
      // Ensure no commits are found for these tests
      octokit_listCommits_mock.mockResolvedValue({ data: [] })
      core_getInput_spy_mock.mockReturnValue('')
    })

    it('returns true for a first issue, even with a prior PR', async () => {
      octokit_listForRepo_mock.mockReturnValue({ data: [{}, { pull_request: {} }] })

      await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

      expect(is_first_time_contributor_spy).toHaveResolvedWith(true)
    })

    it('returns false for a subsequent issue', async () => {
      octokit_listForRepo_mock.mockReturnValue({ data: [{}, {}] })

      await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

      expect(is_first_time_contributor_spy).toHaveResolvedWith(false)
    })

    it('returns true for a first PR, even with a prior issue', async () => {
      octokit_listForRepo_mock.mockReturnValue({ data: [{ pull_request: {} }, {}] })

      await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

      expect(is_first_time_contributor_spy).toHaveResolvedWith(true)
    })

    it('returns false for a subsequent PR', async () => {
      octokit_listForRepo_mock.mockReturnValue({ data: [{ pull_request: {} }, { pull_request: {} }] })

      await is_first_time_contributor(octokit, { ...default_opts, is_pull_request: false })

      expect(is_first_time_contributor_spy).toHaveResolvedWith(false)
    })
  })
})
