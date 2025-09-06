import * as core from '@actions/core'
import * as githubLib from '@actions/github'
import type { Issue, PullRequest } from '@octokit/webhooks-types'
import {
  addLabels,
  createComment,
  getActionInputs,
  getFCEvent,
  isFirstTimeContributor,
  isSupportedEvent
} from '../src/utils/index.ts'

type ErrorOccurred = boolean

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(githubParam?: typeof import('@actions/github')): Promise<ErrorOccurred> {
  const github = githubParam ?? githubLib

  try {
    core.debug('Retrieving webhook payload')
    const payload = github.context.payload
    const payload_action = payload.action
    core.debug('Retrieved webhook payload')

    // check if event is supported
    core.debug('Checking if triggered event is supported')
    const supportedEvent = isSupportedEvent(github.context.eventName, payload_action)
    if (!supportedEvent) {
      core.info(`\`${github.context.eventName}.${payload_action ?? ''}\` event is NOT supported. Exiting..`)
      return false
    }
    core.debug(`Supported event: \`${github.context.eventName}.${payload_action}\``)

    // create octokit client
    core.debug('Retrieving `token` input')
    const token = core.getInput('token', { required: true })
    core.debug('`token` input retrieved')
    core.debug('Creating octokit client')
    const octokit = github.getOctokit(token)
    core.debug('octokit client created')

    // helper variables
    const issueOrPullRequest = (payload.issue ?? payload.pull_request) as Issue | PullRequest
    const firstTimerUsername = issueOrPullRequest.user.login

    // check if author is first-timer
    core.debug('Checking if issue or pull request author is a first-time contributor')
    const firstTimeContributor = await isFirstTimeContributor(octokit, {
      ...github.context.repo,
      creator: firstTimerUsername,
      is_pull_request: !!payload.pull_request
    })
    if (!firstTimeContributor) {
      core.info(`\`${firstTimerUsername}\` is NOT a first-time contributor. Exiting..`)
      return false
    }
    core.debug('Author is a first-time contributor')

    // retrieve inputs
    const fcEvent = getFCEvent(payload_action, payload)
    core.debug('Retrieving relevant message and labels inputs')
    const actionInputs = getActionInputs(fcEvent)
    core.debug('Message and labels inputs retrieved')

    // create comment
    core.debug('Attempting to create comment on GitHub')
    const commentUrl = await createComment(octokit, {
      ...github.context.repo,
      body: actionInputs.msg,
      issue_number: issueOrPullRequest.number,
      author_username: firstTimerUsername
    })
    core.info(commentUrl ? `Comment created: ${commentUrl}` : 'No comment was added')

    // add labels
    core.debug('Attempting to add labels to issue or pull request')
    const didAddLabels = await addLabels(octokit, payload_action, {
      ...github.context.repo,
      labels: actionInputs.labels,
      issue_number: issueOrPullRequest.number
    })
    core.info(didAddLabels ? `Labels added: ${actionInputs.labels.toString()}` : 'No label was added')

    core.setOutput('comment-url', commentUrl)
    core.setOutput('number', issueOrPullRequest.number)
    core.setOutput('type', fcEvent.name)
    core.setOutput('username', firstTimerUsername)

    return false
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed(`Action failed with error ${String(error)}`)
    return true
  }
}
