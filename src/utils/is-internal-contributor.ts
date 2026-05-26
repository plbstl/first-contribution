import * as core from '@actions/core'
import type { getOctokit } from '@actions/github'

/**
 * Checks if an issue or pull request author is an org member
 * or repo collaborator.
 *
 * @param octokit A GitHub Octokit client.
 * @param pat_token A GitHub PAT with `read:org` scope.
 * @param opts {@link IsInternalContributorOpts}
 */
export async function is_internal_contributor(
  org_octokit: ReturnType<typeof getOctokit>,
  opts: IsInternalContributorOpts
): Promise<boolean> {
  const { author, owner, repo } = opts

  const getStatus = (err: unknown): number | undefined => (err as { status?: number } | undefined)?.status
  const is404 = (err: unknown): boolean => getStatus(err) === 404

  core.info(`Checking if @${author} is an org member of \`${owner}\`.`)
  try {
    await org_octokit.rest.orgs.checkMembershipForUser({
      org: owner,
      username: author
    })
    core.info(`@${author} IS a member of \`${owner}\`.`)
    return true
  } catch (err) {
    const status = getStatus(err)
    core.info(`Org membership check returned status: ${String(status)}`)
    if (!is404(err)) throw err
  }

  core.info(`@${author} is NOT a member of \`${owner}\`.`)
  core.info(`Checking if @${author} is a collaborator in \`${owner}/${repo}\`.`)

  try {
    await org_octokit.rest.repos.checkCollaborator({
      username: author,
      owner,
      repo
    })
    core.info(`@${author} IS a collaborator in \`${owner}/${repo}\`.`)
    return true
  } catch (err) {
    const status = getStatus(err)
    core.info(`Collaborator check returned status: ${String(status)}`)
    if (!is404(err)) throw err
  }
  core.info(`@${author} is NOT an internal contributor.`)
  return false
}

interface IsInternalContributorOpts {
  /** Username of the user that created the issue or pull request. */
  author: string
  /** Name of the repository owner or organization. */
  owner: string
  /** Name of the repository. */
  repo: string
}
