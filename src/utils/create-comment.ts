import type { GitHub } from '@actions/github/lib/utils.d.ts'

/**
 * Creates a comment in the specified issue or pull request.
 * @param octokit A GitHub Octokit client.
 * @param opts {@link CreateCommentOpts}
 * @returns A link to the created comment on GitHub.
 */
export async function create_comment(octokit: InstanceType<typeof GitHub>, opts: CreateCommentOpts): Promise<string> {
  // Only add comment when body is NOT empty.
  if (!opts.body) return ''

  // Replace {fc-author} with the issue or pull request author
  const { author_username, body, ...rest } = opts
  const transformed_body = body.replaceAll('{fc-author}', author_username)

  // Create a comment on GitHub and return its html_url
  const comment = await octokit.rest.issues.createComment({ ...rest, body: transformed_body })
  return comment.data.html_url
}

interface CreateCommentOpts {
  /** The body of the comment to be made. */
  body: string
  /** The ID of the issue or pull request to comment on. */
  issue_number: number
  /** Username of the repository's owner. */
  owner: string
  /** Name of the repository. */
  repo: string
  /** Username of the issue or pull request author. */
  author_username: string
}
