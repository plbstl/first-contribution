import * as core from '@actions/core'
import * as github from '@actions/github'
import type { Issue, PullRequest } from '@octokit/webhooks-types'
import { getActionInputs } from './utils/action-inputs'
import { getFCEvent } from './utils/fc-event'
import { isFirstTimeContributor, isSupportedEvent } from './utils/helpers'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const payload = github.context.payload

    // check if event is supported
    const supportedEvent = isSupportedEvent(github.context.eventName, payload.action)
    if (!supportedEvent) {
      return
    }

    // create octokit client
    const token = core.getInput('token', { required: true })
    const octokit = github.getOctokit(token)

    // check if author is first-timer
    const firstTimeContributor = await isFirstTimeContributor(github.context, octokit)
    if (!firstTimeContributor) {
      return
    }

    // retrieve inputs
    const fcEvent = getFCEvent(payload)
    const actionInputs = getActionInputs(fcEvent)

    // helper variables
    let commentUrl = ''
    const issueOrPullRequest = (payload.issue || payload.pull_request) as Issue | PullRequest

    // create comment
    if (actionInputs.msg) {
      const comment = await octokit.rest.issues.createComment({
        ...github.context.repo,
        body: actionInputs.msg,
        issue_number: issueOrPullRequest.number
      })
      commentUrl = comment.data.html_url
    }

    // add labels
    if (payload.action === 'opened' && actionInputs.labels.length > 0) {
      await octokit.rest.issues.addLabels({
        ...github.context.repo,
        issue_number: issueOrPullRequest.number
      })
    }

    core.setOutput('comment-url', commentUrl)
    core.setOutput('id', issueOrPullRequest.number)
    core.setOutput('type', fcEvent.name)
    core.setOutput('username', issueOrPullRequest.user.login)

    // ----
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
