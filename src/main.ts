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
    const issueOrPullRequest = (payload.issue || payload.pull_request) as Issue | PullRequest

    // create comment
    const commentUrl = await createComment(octokit, {
      ...github.context.repo,
      body: actionInputs.msg,
      issue_number: issueOrPullRequest.number
    })

    // add labels
    await addLabels(octokit, payload.action || '', {
      ...github.context.repo,
      labels: actionInputs.labels,
      issue_number: issueOrPullRequest.number
    })

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
