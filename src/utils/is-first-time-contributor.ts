import * as core from '@actions/core'
import type { GitHub } from '@actions/github/lib/utils.ts'

/**
 * Checks if an issue or pull request author is a first-time contributor based on the specified contribution mode.
 *
 * This function determines contributor status by fetching all issues and pull requests ever created by the author
 * in the repository and analyzing the count based on the action's configuration.
 *
 * @param octokit A GitHub Octokit client.
 * @param opts Options for checking the contributor's status. See {@link IsFirstTimeContributorOpts}.
 * @returns `true` if the author meets the "first-time contributor" criteria for the given event, otherwise `false`.
 */
export async function isFirstTimeContributor(
  octokit: InstanceType<typeof GitHub>,
  opts: IsFirstTimeContributorOpts
): Promise<boolean> {
  const { isPullRequest, ...listForRepoOpts } = opts

  // Fetch all issues and PRs by the author to get a complete history.
  // We set state to 'all' to ensure we don't miss any previous contributions.
  const { data: contributions } = await octokit.rest.issues.listForRepo({
    ...listForRepoOpts,
    state: 'all'
  })

  const contributionMode = core.getInput('contribution-mode')

  // --- Mode 1: Track first contribution ONCE across both issues and PRs ---
  // If the user has exactly one contribution (the one that triggered this workflow),
  // they are a first-time contributor.
  if (contributionMode === 'once') {
    return contributions.length === 1
  }

  // --- Mode 2: Track first issues and first PRs INDEPENDENTLY ---
  // This is the default behavior. A user can be a first-timer for an issue
  // and also a first-timer for a pull request.
  if (isPullRequest) {
    const prCount = contributions.filter(item => item.pull_request).length
    return prCount === 1
  } else {
    const issueCount = contributions.filter(item => !item.pull_request).length
    return issueCount === 1
  }
}

interface IsFirstTimeContributorOpts {
  /** Username of the user that created the issue or pull request. */
  creator: string
  /** Whether the contribution that triggered the workflow is a pull request. */
  isPullRequest: boolean
  /** Username of the repository's owner. */
  owner: string
  /** Name of the repository. */
  repo: string
}
