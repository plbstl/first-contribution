import type { GitHub } from '@actions/github/lib/utils.d.ts'
import type { Issue, PullRequest } from '@octokit/webhooks-types'

/**
 * Checks if the specific issue or pull request that triggered the workflow
 * was the author's very first contribution of that type.
 * @param octokit A GitHub Octokit client.
 * @param opts Options for checking the contributor's status.
 * @returns `true` if the event's payload was the user's first contribution.
 */
export async function was_the_first_contribution(
  octokit: InstanceType<typeof GitHub>,
  opts: WasTheFirstContributionOpts
): Promise<boolean> {
  const { is_pull_request, issue_or_pull_request, ...listForRepo_opts } = opts

  const { data: contributions } = await octokit.rest.issues.listForRepo({
    ...listForRepo_opts,
    state: 'all',
    sort: 'created',
    direction: 'asc'
  })

  // Filter for either issues or PRs
  const relevant_contributions = contributions.filter(item =>
    is_pull_request ? !!item.pull_request : !item.pull_request
  )

  // Re-sort the filtered list just to be sure
  relevant_contributions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Check if the number of the issue/PR from the event payload
  // matches the number of the very first item in the sorted list.
  const first_ever_contribution = relevant_contributions.at(0)
  // Should not happen, but as a safeguard
  if (!first_ever_contribution) return false
  return first_ever_contribution.number === issue_or_pull_request.number
}

interface WasTheFirstContributionOpts {
  creator: string
  is_pull_request: boolean
  issue_or_pull_request: Issue | PullRequest
  owner: string
  repo: string
}
