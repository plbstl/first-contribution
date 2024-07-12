import type { Context } from '@actions/github/lib/context'
import type { GitHub } from '@actions/github/lib/utils'

/**
 * Checks whether the triggered event is supported by first-contribution GitHub Action.
 * @param eventName Name of the triggered event.
 * @param [action] Action that caused the event to trigger.
 * @returns
 */
export function isSupportedEvent(eventName: string, action?: string): boolean {
  const eventCode = `${eventName}.${action}`
  const supportedEventCodes = [
    'issues.opened',
    'issues.closed',
    'pull_request.opened',
    'pull_request.closed',
    'pull_request_target.opened',
    'pull_request_target.closed'
  ]
  return supportedEventCodes.includes(eventCode)
}

/**
 * Checks whether the author of the issue or pull request is a first-time contributor.
 * @param githubContext Context from the `@actions/github` library.
 * @param octokit - A GitHub Octokit client.
 * @returns `true` if author is a first-time contributor, and `false` otherwise.
 */
export async function isFirstTimeContributor(
  githubContext: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<boolean> {
  const payload = githubContext.payload

  const firstTimePrAuthorAssociations = ['FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR']
  if (payload.pull_request) {
    // This is a pull request.
    return firstTimePrAuthorAssociations.includes(payload.pull_request.author_association)
  }

  // This is an issue.
  const response = await octokit.rest.issues.listForRepo({
    ...githubContext.repo,
    creator: payload.issue?.user.login,
    state: 'all'
  })
  if (response.data.filter(issue => !issue.pull_request).length === 1) {
    return true
  }

  return false
}

type CreateCommentOpts = {
  /** The body of the comment to be made. */
  body: string
  /** The ID of the issue or pull request to comment on. */
  issue_number: number
  /** Username of the repository's owner. */
  owner: string
  /** Name of the repository. */
  repo: string
}

/**
 * Creates a comment in the specified issue or pull request.
 * @param octokit - A GitHub Octokit client.
 * @param opts {@link CreateCommentOpts}
 * @returns A link to the created comment on GitHub.
 */
export async function createComment(octokit: InstanceType<typeof GitHub>, opts: CreateCommentOpts): Promise<string> {
  // Only add comment when body is NOT empty.
  if (!opts.body) return ''

  // Create a comment on GitHub and return its html_url
  try {
    const comment = await octokit.rest.issues.createComment(opts)
    return comment.data.html_url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    }
    throw error
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
  // Only add labels when the action that triggered the event is 'opened' and list of labels is NOT empty.
  if (payloadAction !== 'opened' && opts.labels.length === 0) return

  // Add labels
  try {
    await octokit.rest.issues.addLabels({ ...opts })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    }
    throw new Error(error.message)
  }
}
