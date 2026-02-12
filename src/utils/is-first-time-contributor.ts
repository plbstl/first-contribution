import * as core from '@actions/core'
import type { getOctokit } from '@actions/github'

/**
 * Checks if an issue or pull request author is a first-time
 * contributor based on the specified contribution mode.
 *
 * @param octokit A GitHub Octokit client.
 * @param opts {@link IsFirstTimeContributorOpts}
 * @returns `true` if the author meets the "first-time contributor" criteria for the given event, otherwise `false`.
 */
export async function is_first_time_contributor(
  octokit: ReturnType<typeof getOctokit>,
  opts: IsFirstTimeContributorOpts
): Promise<boolean> {
  const { is_pull_request, creator, owner, repo } = opts

  core.debug('Retrieving commit history')

  // Check for any prior commits by the user
  const { data: commits } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    author: creator,
    per_page: 1
  })
  core.info(`Author's commit_count: ${commits.length.toString()}`)
  if (commits.length > 0) {
    return false
  }

  core.debug('No prior commits. Retrieving issues and PRs')

  // Fetch all issues and PRs by the author
  const { data: contributions } = await octokit.rest.issues.listForRepo({
    creator,
    owner,
    repo,
    state: 'all'
  })

  const contribution_mode = core.getInput('contribution-mode')

  // Mode 1: Track first contribution ONCE across both issues and PRs.
  // If the user has exactly one contribution (the one that triggered this workflow),
  // they are a first-time contributor
  if (contribution_mode === 'once') {
    core.info("This is the author's first ever contribution to this repo")
    return contributions.length === 1
  }

  // Mode 2: Track first issues and first PRs INDEPENDENTLY.
  // This is the default behavior. A user can be a first-timer
  // for an issue and also a first-timer for a pull request
  if (is_pull_request) {
    const pr_count = contributions.filter(item => item.pull_request).length
    core.info(`Author's pr_count: ${pr_count.toString()}`)
    return pr_count === 1
  } else {
    const issue_count = contributions.filter(item => !item.pull_request).length
    core.info(`Author's issue_count: ${issue_count.toString()}`)
    return issue_count === 1
  }
}

interface IsFirstTimeContributorOpts {
  /** Username of the user that created the issue or pull request. */
  creator: string
  /** Whether the contribution that triggered the workflow is a pull request. */
  is_pull_request: boolean
  /** Username of the repository's owner. */
  owner: string
  /** Name of the repository. */
  repo: string
}
