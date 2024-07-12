import type { Context } from '@actions/github/lib/context'
import type { GitHub } from '@actions/github/lib/utils'

/**
 * Checks whether the author of the issue or pull request is a first-time contributor.
 * @param githubContext Context from the `@actions/github` library.
 * @param octokit - A GitHub Octokit client.
 * @returns `true` if author is a first-time contributor, and `false` otherwise.
 */
export async function isFirstTimeContributor(
  githubContext: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<boolean> {
  const payload = githubContext.payload

  const firstTimePrAuthorAssociations = ['FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR']
  if (payload.pull_request) {
    // This is a pull request.
    return firstTimePrAuthorAssociations.includes(payload.pull_request.author_association)
  }

  // This is an issue.
  const response = await octokit.rest.issues.listForRepo({
    ...githubContext.repo,
    creator: payload.issue?.user.login,
    state: 'all'
  })
  if (response.data.filter(issue => !issue.pull_request).length === 1) {
    return true
  }

  return false
}
