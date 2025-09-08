/**
 * Unit tests for the action's `create_comment` util.
 */

import { describe, expect, it } from 'vitest'
import { create_comment } from '~src/utils/index.ts'
import { octokit } from '~tests/helpers.ts'
import { octokit_createComment_mock } from '~tests/setup.ts'

describe('create_comment()', () => {
  it('comments on an issue or pull request', async () => {
    const created_comment_url = 'https://gh.repo/comment'
    octokit_createComment_mock.mockReturnValue({ data: { html_url: created_comment_url } })
    const create_comment_opts = {
      body: 'Message body',
      issue_number: 1,
      owner: 'owner',
      repo: 'repo'
    }

    const comment_url = await create_comment(octokit, { ...create_comment_opts, author_username: 'randomUser007' })

    expect(comment_url).toBe(created_comment_url)
    expect(octokit_createComment_mock).toHaveBeenCalledWith(create_comment_opts)
  })

  it('does not comment when the input message is empty', async () => {
    const create_comment_opts = {
      body: '',
      issue_number: 2,
      owner: 'owner',
      repo: 'repo',
      author_username: 'randomUser007'
    }

    const comment_url = await create_comment(octokit, create_comment_opts)

    expect(comment_url).toBe('')
    expect(octokit_createComment_mock).not.toHaveBeenCalled()
  })
})
