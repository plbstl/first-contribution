import * as core from '@actions/core'
import * as github from '@actions/github'
import type { Issue, PullRequest } from '@octokit/webhooks-types'
import {
  add_labels,
  add_reactions,
  create_comment,
  get_action_inputs,
  get_fc_event,
  is_first_time_contributor,
  is_internal_contributor,
  is_supported_event,
  was_the_first_contribution
} from './utils/index.ts'

type ErrorOccurred = boolean

/**
 * The main function for the action.
 * @returns {Promise<ErrorOccurred>} Resolves when the action is complete.
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
      core.info(`\`${github.context.eventName}.${String(payload_action)}\` event is NOT supported. Exiting..`)
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
    const fc_event = get_fc_event(payload_action, payload)
    const interaction = fc_event.name === 'issue' ? 'issue' : 'pull request'
    const issue_or_pull_request = (payload.issue ?? payload.pull_request) as Issue | PullRequest
    const first_timer_username = issue_or_pull_request.user.login
    const owner = github.context.repo.owner
    const repo = github.context.repo.repo
    const is_pull_request = !!payload.pull_request

    // skip internal contributors
    const is_internal = await is_internal_contributor(octokit, { creator: first_timer_username, owner, repo })
    if (is_internal) {
      core.info(`@${first_timer_username} is an internal contributor. Exiting..`)
      return false
    } else {
      core.debug(`@${first_timer_username} is NOT an internal contributor.`)
    }

    // check if author is first-timer
    core.debug(`Checking if ${interaction} is a first-time contribution from its author`)
    let is_relevant_first_timer = false
    if (payload_action === 'opened') {
      core.debug('Event is "opened". Checking for first-time contributor.')
      is_relevant_first_timer = await is_first_time_contributor(octokit, {
        owner,
        repo,
        creator: first_timer_username,
        is_pull_request
      })
    } else {
      core.debug('Event is "closed". Checking if this was their first contribution.')
      is_relevant_first_timer = await was_the_first_contribution(octokit, {
        owner,
        repo,
        creator: first_timer_username,
        is_pull_request,
        issue_or_pull_request
      })
    }

    if (!is_relevant_first_timer) {
      core.info(`\`${first_timer_username}\` does not meet the criteria for being a first timer. Exiting..`)
      return false
    }
    core.debug('Author meets the criteria for this event.')

    // retrieve inputs
    core.debug('Retrieving relevant message and labels inputs')
    const action_inputs = get_action_inputs(fc_event)
    core.debug('Message and labels inputs retrieved')

    // add reactions
    core.debug(`Attempting to react with: ${action_inputs.reactions.toString()}`)
    await add_reactions(octokit, payload_action, {
      owner,
      repo,
      issue_number: issue_or_pull_request.number,
      reactions: action_inputs.reactions
    })

    // create comment
    core.debug('Attempting to create comment on GitHub')
    const comment_url = await create_comment(octokit, {
      owner,
      repo,
      body: action_inputs.msg,
      issue_number: issue_or_pull_request.number,
      author_username: first_timer_username
    })
    core.info(comment_url ? `Comment created: ${comment_url}` : 'No comment was added')

    const truncated_msg = action_inputs.msg.replace(/^(.{150}).+(.{50})$/, '$1...$2')
    core.info(`Comment body:\n${truncated_msg}`)

    // add labels
    core.debug(`Attempting to add labels to ${interaction}`)
    const did_add_labels = await add_labels(octokit, payload_action, {
      owner,
      repo,
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
    const fail_on_error = core.getBooleanInput('fail-on-error')
    const message = error instanceof Error ? error.message : `Unknown error: ${JSON.stringify(error)}`

    if (fail_on_error) {
      core.setFailed(message)
    } else {
      core.error(message)
    }
    return true
  }
}

// too lazy to also show end part of the message. and add tests
// function truncateStringAtWord(str: string, limit = 200) {
//   const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
//   let lastWordBreak = -1

//   for (const word of segmenter.segment(str)) {
//     if (word.isWordLike) continue
//     if (word.index >= limit) break
//     lastWordBreak = word.index
//   }

//   return str.slice(0, lastWordBreak) + '...'
// }
