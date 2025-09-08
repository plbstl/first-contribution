import type { GitHub } from '@actions/github/lib/utils.d.ts'

/**
 * Adds labels to the specified issue or pull request.
 * @param octokit A GitHub Octokit client.
 * @param payload_action Action that triggered the event.
 * @param opts {@link AddLabelsOpts}
 */
export async function add_labels(
  octokit: InstanceType<typeof GitHub>,
  payload_action: 'opened' | 'closed',
  opts: AddLabelsOpts
): Promise<boolean> {
  // Only add labels for new issues/PRs and when the list of input labels is NOT empty.
  if (payload_action === 'opened' && opts.labels.length > 0) {
    // can fail when the specified label is not already created in the repository.
    await octokit.rest.issues.addLabels({ ...opts })
    return true
  }
  return false
}

interface AddLabelsOpts {
  /** List of labels to add to the issue or pull request. */
  labels: string[]
  /** The ID of the issue or pull request to add labels to. */
  issue_number: number
  /** Username of the repository's owner. */
  owner: string
  /** Name of the repository. */
  repo: string
}
