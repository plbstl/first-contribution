import type { GitHub } from '@actions/github/lib/utils'

/**
 * Creates a comment in the specified issue or pull request.
 * @param octokit - A GitHub Octokit client.
 * @param opts {@link CreateCommentOpts}
 * @returns A link to the created comment on GitHub.
 */
export async function createComment(octokit: InstanceType<typeof GitHub>, opts: CreateCommentOpts): Promise<string> {
  // Only add comment when body is NOT empty.
  if (!opts.body) return ''

  // Create a comment on GitHub and return its html_url
  const comment = await octokit.rest.issues.createComment(opts)
  return comment.data.html_url
}

type CreateCommentOpts = {
  /** The body of the comment to be made. */
  body: string
  /** The ID of the issue or pull request to comment on. */
  issue_number: number
  /** Username of the repository's owner. */
  owner: string
  /** Name of the repository. */
  repo: string
}
