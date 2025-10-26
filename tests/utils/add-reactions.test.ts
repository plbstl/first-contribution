/**
 * Unit tests for the action's `add_reactions` util.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { add_reactions } from '~src/utils/index.ts'
import { octokit } from '~tests/helpers.ts'
import { octokit_createReactionForIssue_mock } from '~tests/setup.ts'

describe('add_reactions()', () => {
  const default_opts = {
    owner: 'owner',
    repo: 'repo',
    issue_number: 101
  }

  beforeEach(() => {
    octokit_createReactionForIssue_mock.mockResolvedValue({})
  })

  it('does nothing if the reactions array is empty', async () => {
    await add_reactions(octokit, 'opened', { ...default_opts, reactions: [] })
    expect(octokit_createReactionForIssue_mock).not.toHaveBeenCalled()
  })

  it("does NOT add reactions on 'closed' events", async () => {
    await add_reactions(octokit, 'closed', { ...default_opts, reactions: ['rocket'] })
    expect(octokit_createReactionForIssue_mock).not.toHaveBeenCalled()
  })

  it('adds a single, valid reaction', async () => {
    await add_reactions(octokit, 'opened', { ...default_opts, reactions: ['heart'] })

    expect(octokit_createReactionForIssue_mock).toHaveBeenCalledExactlyOnceWith({
      ...default_opts,
      content: 'heart'
    })
  })

  it('adds multiple, valid reactions', async () => {
    await add_reactions(octokit, 'opened', { ...default_opts, reactions: ['hooray', 'rocket', '+1'] })

    expect(octokit_createReactionForIssue_mock).toHaveBeenCalledTimes(3)
    expect(octokit_createReactionForIssue_mock).toHaveBeenCalledWith(expect.objectContaining({ content: 'hooray' }))
    expect(octokit_createReactionForIssue_mock).toHaveBeenCalledWith(expect.objectContaining({ content: 'rocket' }))
    expect(octokit_createReactionForIssue_mock).toHaveBeenCalledWith(expect.objectContaining({ content: '+1' }))
  })

  it('warns but continues if some of the reactions are invalid', async () => {
    // Make the first call fail, but subsequent calls succeed
    octokit_createReactionForIssue_mock.mockRejectedValueOnce(new Error('Invalid reaction')).mockResolvedValue({})

    await add_reactions(octokit, 'opened', { ...default_opts, reactions: ['invalid_emoji', 'heart'] })

    expect(octokit_createReactionForIssue_mock).toHaveBeenCalledTimes(2)
    expect(octokit_createReactionForIssue_mock).toHaveBeenCalledWith(expect.objectContaining({ content: 'heart' }))
  })
})
