import * as core from '@actions/core'
import type { GitHub } from '@actions/github/lib/utils.d.ts'

interface AddReactionsOpts {
  /** The owner of the repository. */
  owner: string
  /** The name of the repository. */
  repo: string
  /** The number of the issue or pull request. */
  issue_number: number
  /** An array of valid reaction strings. */
  reactions: string[]
}

/**
 * Adds reactions to the main body of an issue or pull request and logs the outcome.
 * @param octokit An authenticated Octokit client.
 * @param opts Options for adding the reactions.
 */
export async function add_reactions(octokit: InstanceType<typeof GitHub>, opts: AddReactionsOpts): Promise<void> {
  if (opts.reactions.length === 0) {
    core.info('No reaction was added')
    return
  }

  const successful_reactions: string[] = []
  const failed_reactions: string[] = []

  core.debug(`Attempting to add reactions: ${opts.reactions.join(', ')}`)

  for (const reaction of opts.reactions) {
    try {
      await octokit.rest.reactions.createForIssue({
        owner: opts.owner,
        repo: opts.repo,
        issue_number: opts.issue_number,
        // @ts-expect-error - The type is validated by the API call itself.
        content: reaction
      })
      successful_reactions.push(reaction)
    } catch {
      failed_reactions.push(reaction)
    }
  }

  if (successful_reactions.length > 0) {
    core.info(`Reactions added: ${successful_reactions.join(', ')}`)
  }

  if (failed_reactions.length > 0) {
    core.warning(`Failed to add reaction(s): ${failed_reactions.join(', ')}`)
  }
}
