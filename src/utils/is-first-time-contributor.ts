import type { GitHub } from '@actions/github/lib/utils.ts'

/**
 * Checks if an issue or PR author is a first-time contributor.
 *
 * Users can have multiple opened issues and PRs, this action will have commented on only 1 of them.
 * But the first time that they close an issue/PR, we have to decide if it is their first authored issue/PR.
 *
 * Issues and PRs have separate comments to be attached.
 * A user can be a first-timer twice. Once for issues, and the other for PRs.
 *
 * `contribution-mode` action option can be set to tweak this behaviour.
 *
 * @param octokit A GitHub Octokit client.
 * @param opts {@link IsFirstTimeContributorOpts}
 * @returns `true` if the author meets the "first-time contributor" criteria
 * for the given event, and `false` otherwise.
 */
export async function isFirstTimeContributor(
  octokit: InstanceType<typeof GitHub>,
  opts: IsFirstTimeContributorOpts
): Promise<boolean> {
  const { payload_action, ...listForRepoOpts } = opts

  const { data } = await octokit.rest.issues.listForRepo({
    ...listForRepoOpts,
    state: payload_action === 'opened' ? 'open' : 'closed'
  })

  // Only 1 issue/PR means the first contribution
  if (data.length === 1) {
    return true
  }

  // Check if the issue/PR was authored by a first-timer.
  // They can have multiple opened issues/PRs, this action will have commented on only 1 of them.

  // But the first time that they close an issue/PR, we have to add a new comment (if any).

  // Something to consider, is, issues and PRs have separate comments to be attached.
  // In a way, a user can be a first-timer twice. Once for issues, and the other for PRs.

  // This needs to be explicit in the docs.

  let prCount = 0
  let issueCount = 0

  for (const doc of data) {
    if (doc.pull_request) {
      prCount++
    } else {
      issueCount++
    }

    // This also works for closed issues/PRs because if the count is only 1,
    // that means the "1" is this current issue/PR.
    if (issueCount > 1 || prCount > 1) {
      return false
    }
  }

  return true
}

interface IsFirstTimeContributorOpts {
  /** Username of the user that created the issue or pull request. */
  creator: string
  /**
   * The action that triggered the workflow run (e.g., 'opened', 'closed').
   * Typically from `github.context.payload.action`.
   */
  payload_action: 'opened' | 'closed'
  /** Username of the repository's owner. */
  owner: string
  /** Name of the repository. */
  repo: string
}
