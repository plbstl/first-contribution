import * as core from '@actions/core'
import * as githubLib from '@actions/github'
import type { Issue, PullRequest } from '@octokit/webhooks-types'
import { addLabels } from '../src/utils/add-labels'
import { createComment } from '../src/utils/create-comment'
import { isFirstTimeContributor } from '../src/utils/is-first-time-contributor'
import { isSupportedEvent } from '../src/utils/is-supported-event'
import { getActionInputs } from './utils/action-inputs'
import { getFCEvent } from './utils/fc-event'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(githubParam?: typeof import('@actions/github')): Promise<void> {
  const github = githubParam || githubLib

  try {
    core.debug('Retrieving webhook payload')
    const payload = github.context.payload
    core.debug('Retrieved webhook payload')

    // check if event is supported
    core.debug('Checking if triggered event is supported')
    const supportedEvent = isSupportedEvent(github.context.eventName, payload.action)
    if (!supportedEvent) {
      core.info(`\`${github.context.eventName}.${payload.action}\` event is NOT supported. Exiting..`)
      return
    }
    core.debug(`Supported event: \`${github.context.eventName}.${payload.action}\``)

    // create octokit client
    core.debug('Retrieving `token` input')
    const token = core.getInput('token', { required: true })
    core.debug('`token` input retrieved')
    core.debug('Creating octokit client')
    const octokit = github.getOctokit(token)
    core.debug('octokit client created')

    // helper variables
    const issueOrPullRequest = (payload.issue || payload.pull_request) as Issue | PullRequest

    // check if author is first-timer
    core.debug('Checking if issue or pull request author is a first-time contributor')
    const firstTimeContributor = await isFirstTimeContributor(github.context, octokit)
    if (!firstTimeContributor) {
      core.info(`\`${issueOrPullRequest.user.login}\` is NOT a first-time contributor. Exiting..`)
      return
    }
    core.debug('Author is a first-time contributor')

    // retrieve inputs
    const fcEvent = getFCEvent(payload)
    core.debug('Retrieving relevant message and labels inputs')
    const actionInputs = getActionInputs(fcEvent)
    core.debug('Message and labels inputs retrieved')

    // create comment
    core.debug('Attempting to create comment on GitHub')
    const commentUrl = await createComment(octokit, {
      ...github.context.repo,
      body: actionInputs.msg,
      issue_number: issueOrPullRequest.number
    })
    core.debug(commentUrl ? `Comment created: ${commentUrl}` : 'No comment was added')

    // add labels
    core.debug('Attempting to add labels to issue or pull request')
    const didAddLabels = await addLabels(octokit, payload.action || '', {
      ...github.context.repo,
      labels: actionInputs.labels,
      issue_number: issueOrPullRequest.number
    })
    core.debug(didAddLabels ? `Labels added: ${actionInputs.labels}` : 'No label was added')

    core.setOutput('comment-url', commentUrl)
    core.setOutput('number', issueOrPullRequest.number)
    core.setOutput('type', fcEvent.name)
    core.setOutput('username', issueOrPullRequest.user.login)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // Fail the workflow run if an error occurs
    if (error.response) {
      core.setFailed(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
      return
    }
    if (error instanceof Error) core.setFailed(error.message)
  }
}
