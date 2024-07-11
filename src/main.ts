import * as core from '@actions/core'
import * as github from '@actions/github'
import type { Issue, PullRequest } from '@octokit/webhooks-types'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const payload = github.context.payload
    const event = `${github.context.eventName}.${payload.action}`

    // check supported events + actions
    const supportedEvents = [
      'issues.opened',
      'issues.closed',
      'pull_request.opened',
      'pull_request.closed',
      'pull_request_target.opened',
      'pull_request_target.closed'
    ]

    if (!supportedEvents.includes(event)) {
      return
    }

    // create octokit client
    const token = core.getInput('token', { required: true })
    const octokit = github.getOctokit(token)

    // check is first-timer
    if (payload.pull_request) {
      if (!['FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR'].includes(payload.pull_request.author_association)) {
        return
      }
    } else {
      const response = await octokit.rest.issues.listForRepo({
        ...github.context.repo,
        creator: payload.issue?.user.login,
        state: 'all'
      })

      if (response.data.filter(issue => !issue.pull_request).length > 1) {
        return
      }
    }

    // retrieve msg input
    const messageInputs = [
      'discussion-created-msg',
      'issue-opened-msg',
      'issue-completed-msg',
      'issue-not-planned-msg',
      'pr-opened-msg',
      'pr-merged-msg',
      'pr-closed-msg'
    ]

    const eventType = payload.pull_request ? 'pr' : 'issue'
    const issueOrPullRequest = (payload.issue || payload.pull_request) as Issue | PullRequest

    type EventAction = 'opened' | 'completed' | 'not-planned' | 'merged' | 'closed'
    let eventAction: EventAction = 'opened'

    if (payload.action !== 'opened') {
      if (payload.pull_request) {
        eventAction = payload.pull_request?.merged ? 'merged' : 'closed'
      } else {
        eventAction = payload.issue?.state_reason === 'completed' ? 'completed' : 'not-planned'
      }
    }

    let msg = core.getInput(`${eventType}-${eventAction}-msg`).trim()

    if (messageInputs.includes(msg)) {
      msg = core.getInput(msg).trim()
    }

    // create comment
    let commentUrl = ''
    if (msg) {
      const comment = await octokit.rest.issues.createComment({
        ...github.context.repo,
        body: msg,
        issue_number: issueOrPullRequest.number
      })
      commentUrl = comment.data.html_url
    }

    // add labels
    if (payload.action === 'opened') {
      const labelsInput = core.getInput(`${eventType}-labels`) || core.getInput('labels')
      const labels = labelsInput.split(',').map(label => label.trim())

      if (labels.length > 0) {
        await octokit.rest.issues.addLabels({
          ...github.context.repo,
          issue_number: issueOrPullRequest.number
        })
      }
    }

    core.setOutput('comment-url', commentUrl)
    core.setOutput('id', issueOrPullRequest.number)
    core.setOutput('type', eventType)
    core.setOutput('username', issueOrPullRequest.user.login)

    //
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
