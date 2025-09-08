import * as core from '@actions/core'
import * as github from '@actions/github'
import type { Issue, PullRequest } from '@octokit/webhooks-types'
import {
  add_labels,
  create_comment,
  get_action_inputs,
  get_fc_event,
  is_first_time_contributor,
  is_supported_event
} from '../src/utils/index.ts'

type ErrorOccurred = boolean

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<ErrorOccurred> {
  try {
    core.debug('Retrieving webhook payload')
    const payload = github.context.payload
    const payload_action = payload.action
    core.debug('Retrieved webhook payload')

    // check if event is supported
    core.debug('Checking if triggered event is supported')
    const supported_event = is_supported_event(github.context.eventName, payload_action)
    if (!supported_event) {
      core.info(`\`${github.context.eventName}.${JSON.stringify(payload_action)}\` event is NOT supported. Exiting..`)
      return false
    }
    core.debug(`Supported event: \`${github.context.eventName}.${payload_action}\``)

    // create octokit client
    core.debug('Retrieving `token` input')
    const token = core.getInput('token', { required: true })
    core.debug('`token` input retrieved')
    core.debug('Creating octokit client')
    const octokit = github.getOctokit(token)
    core.debug('Octokit client created')

    // helper variables
    const issue_or_pull_request = (payload.issue ?? payload.pull_request) as Issue | PullRequest
    const first_timer_username = issue_or_pull_request.user.login

    // check if author is first-timer
    core.debug('Checking if issue or pull request author is a first-time contributor')
    const first_time_contributor = await is_first_time_contributor(octokit, {
      ...github.context.repo,
      creator: first_timer_username,
      is_pull_request: !!payload.pull_request
    })
    if (!first_time_contributor) {
      core.info(`\`${first_timer_username}\` is NOT a first-time contributor. Exiting..`)
      return false
    }
    core.debug('Author is a first-time contributor')

    // retrieve inputs
    const fc_event = get_fc_event(payload_action, payload)
    core.debug('Retrieving relevant message and labels inputs')
    const action_inputs = get_action_inputs(fc_event)
    core.debug('Message and labels inputs retrieved')

    // create comment
    core.debug('Attempting to create comment on GitHub')
    const comment_url = await create_comment(octokit, {
      ...github.context.repo,
      body: action_inputs.msg,
      issue_number: issue_or_pull_request.number,
      author_username: first_timer_username
    })
    core.info(comment_url ? `Comment created: ${comment_url}` : 'No comment was added')

    // add labels
    core.debug('Attempting to add labels to issue or pull request')
    const did_add_labels = await add_labels(octokit, payload_action, {
      ...github.context.repo,
      labels: action_inputs.labels,
      issue_number: issue_or_pull_request.number
    })
    core.info(did_add_labels ? `Labels added: ${action_inputs.labels.toString()}` : 'No label was added')

    core.setOutput('comment-url', comment_url)
    core.setOutput('number', issue_or_pull_request.number)
    core.setOutput('type', fc_event.name)
    core.setOutput('username', first_timer_username)

    return false
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed(`Action failed with error ${JSON.stringify(error)}`)
    return true
  }
}
