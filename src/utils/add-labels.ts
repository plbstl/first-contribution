import type { GitHub } from '@actions/github/lib/utils'

/**
 * Adds labels to the specified issue or pull request.
 * @param octokit - A GitHub Octokit client.
 * @param payloadAction - Action that triggered the event.
 * @param opts {@link AddLabelsOpts}
 */
export async function addLabels(
  octokit: InstanceType<typeof GitHub>,
  payloadAction: string,
  opts: AddLabelsOpts
): Promise<void> {
  // Only add labels for new issues/PRs when the list of labels is NOT empty.
  if (payloadAction === 'opened' && opts.labels.length > 0) {
    await octokit.rest.issues.addLabels({ ...opts })
  }
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
