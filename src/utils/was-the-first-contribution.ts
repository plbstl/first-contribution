import * as core from '@actions/core'
import type { getOctokit } from '@actions/github'
import type { Issue, PullRequest } from '@octokit/webhooks-types'

/**
 * Checks if the specific issue or pull request that triggered the workflow
 * was the author's very first contribution of that type.
 *
 * @note This works even when the author has multiple issues/PRs.
 * We're only targeting the very first one.
 *
 * @param octokit A GitHub Octokit client.
 * @param opts {@link WasTheFirstContributionOpts}
 * @returns `true` if the event's payload was the user's first contribution.
 */
export async function was_the_first_contribution(
  octokit: ReturnType<typeof getOctokit>,
  opts: WasTheFirstContributionOpts
): Promise<boolean> {
  const { is_pull_request, issue_or_pull_request, ...listForRepo_opts } = opts

  core.debug('Retrieving issues and PRs')

  const { data: contributions } = await octokit.rest.issues.listForRepo({
    ...listForRepo_opts,
    state: 'all',
    sort: 'created',
    direction: 'asc'
  })

  core.debug('Filtering for relevant contributions')

  // Filter for either issues or PRs
  const relevant_contributions = contributions.filter(item =>
    is_pull_request ? !!item.pull_request : !item.pull_request
  )

  core.info(`Author's relevant_contributions_count: ${relevant_contributions.length.toString()}`)

  // Re-sort the filtered list just to be sure
  relevant_contributions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Check if the number of the issue/PR from the event payload
  // matches the number of the very first item in the sorted list
  const first_ever_contribution = relevant_contributions.at(0)

  // Should not happen, but as a safeguard
  if (!first_ever_contribution) {
    core.info('Interesting...')
    core.info(`All contributions by @${listForRepo_opts.creator}:\n${JSON.stringify(contributions)}\n`)
    return false
  }

  core.info(`Author's first_ever_contribution issue/PR number: ${first_ever_contribution.number.toString()}`)
  return first_ever_contribution.number === issue_or_pull_request.number
}

interface WasTheFirstContributionOpts {
  creator: string
  is_pull_request: boolean
  issue_or_pull_request: Issue | PullRequest
  owner: string
  repo: string
}
