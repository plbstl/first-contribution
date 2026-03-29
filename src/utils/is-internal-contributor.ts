import * as core from '@actions/core'
import type { getOctokit } from '@actions/github'

/**
 * Checks if an issue or pull request author is a collaborator.
 *
 * @param octokit A GitHub Octokit client.
 * @param opts {@link IsInternalContributorOpts}
 */
export async function is_internal_contributor(
  octokit: ReturnType<typeof getOctokit>,
  opts: IsInternalContributorOpts
): Promise<boolean> {
  const { creator, owner, repo } = opts

  const skip_internal_contributors = core.getBooleanInput('skip-internal-contributors')
  core.debug(`skip-internal-contributors: ${String(skip_internal_contributors)}.`)

  const disabled = !skip_internal_contributors

  core.debug(`Checking if @${creator} is an internal contributor.`)
  try {
    await octokit.rest.repos.checkCollaborator({
      username: creator,
      owner,
      repo
    })

    if (disabled) {
      core.info('Consider enabling `skip-internal-contributors` to avoid greeting internal contributors.')
      return false
    }

    return true
  } catch (error) {
    if ((error as { status: number } | undefined)?.status === 404) {
      // not a collaborator
      return false
    }

    throw error
  }
}

interface IsInternalContributorOpts {
  /** Username of the user that created the issue or pull request. */
  creator: string
  /** Username of the repository's owner. */
  owner: string
  /** Name of the repository. */
  repo: string
}
