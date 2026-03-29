import * as core from '@actions/core'
import type { getOctokit } from '@actions/github'
import * as github from '@actions/github'

/**
 * Checks if an issue or pull request author is an org member
 * or repo collaborator.
 *
 * @param octokit A GitHub Octokit client.
 * @param pat_token A GitHub PAT with `read:org` scope
 * @param opts {@link IsInternalContributorOpts}
 */
export async function is_internal_contributor(
  octokit: ReturnType<typeof getOctokit>,
  pat_token: string,
  opts: IsInternalContributorOpts
): Promise<boolean> {
  const { creator, owner, repo } = opts

  const skip = core.getBooleanInput('skip-internal-contributors')
  core.debug(`skip-internal-contributors: ${String(skip)}.`)

  const is404 = (err: unknown): boolean => (err as { status: number } | undefined)?.status === 404

  const isMember = await (async () => {
    core.debug(`Checking if @${creator} is an org member.`)

    try {
      await github.getOctokit(pat_token).rest.orgs.checkMembershipForUser({
        org: owner,
        username: creator
      })
      return true
    } catch (err) {
      if (!is404(err)) throw err
    }

    core.debug(`@${creator} is NOT a member of \`${owner}\`.`)

    core.debug(`Checking if @${creator} is a collaborator in \`${repo}\`.`)
    try {
      await octokit.rest.repos.checkCollaborator({
        username: creator,
        owner,
        repo
      })
      return true
    } catch (err) {
      if (!is404(err)) throw err
      return false
    }
  })()

  if (!isMember) return false

  if (!skip) {
    core.info('Consider enabling `skip-internal-contributors` to avoid greeting internal contributors.')
    return false
  }

  return true
}

interface IsInternalContributorOpts {
  /** Username of the user that created the issue or pull request. */
  creator: string
  /** Name of the repository's owner. */
  owner: string
  /** Name of the repository. */
  repo: string
}
