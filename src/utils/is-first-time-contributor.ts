import type { Context } from '@actions/github/lib/context'
import type { GitHub } from '@actions/github/lib/utils'

/**
 * Checks whether the author of the issue or pull request is a first-time contributor.
 *
 * If the action trigger is a `closed` event, this function takes into account
 * whether the author only has opened issues and PRs or not.
 * @param githubContext Context from the `@actions/github` library.
 * @param octokit - A GitHub Octokit client.
 * @returns `true` if author is a first-time contributor, and `false` otherwise.
 */
export async function isFirstTimeContributor(
  githubContext: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<boolean> {
  const payload = githubContext.payload

  const response = await octokit.rest.issues.listForRepo({
    ...githubContext.repo,
    creator: payload.issue?.user.login,
    state: 'all'
  })

  // Take into account whether the user only has opened issues and PRs,
  // for when commenting on a closed issue or PR.
  if (payload.action === 'closed') {
    return response.data.some(issueOrPullRequest => issueOrPullRequest.state === 'closed')
  }

  if (response.data.length === 1) {
    return true
  }
  return false
}
