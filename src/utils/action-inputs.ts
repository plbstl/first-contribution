import * as core from '@actions/core'
import type { FCEvent } from './fc-event.ts'

/**
 * Gets all inputs to first-contribution GitHub Action and categorize them.
 * @param event A `first-contribution` event.
 * @returns Labels and a message that can be added to the issue or pull request.
 */
export function get_action_inputs(event: FCEvent): ActionInputs {
  return {
    labels: get_labels_input(event.name),
    msg: get_msg_input(event)
  }
}

/** Categorized inputs of the first-contribution GitHub Action. */
interface ActionInputs {
  /** Relevant `-labels` input. */
  labels: string[]
  /** Relevant `-msg` input. */
  msg: string
}

/**
 * Retrieves the relevant `-labels` input or a fallback.
 * @param event_name A `first-contribution` event name.
 * @returns An array of labels to add to the issue or pull request.
 */
function get_labels_input(event_name: FCEvent['name']): string[] {
  const labels = core.getInput(`${event_name}-labels`) || core.getInput('labels')
  return labels ? labels.split(',').map(label => label.trim()) : []
}

/**
 * Retrieves the relevant `-msg` input.
 *
 * Also checks if the message is a symlink to another `-msg`
 * input, and if so, uses the value of the symlinked input instead.
 *
 * For example:
 * ```yaml
 * pr-opened-msg: issue-opened-msg
 * # `getMsgInput()` will return the value of `issue-opened-msg` input
 * ```
 *
 * @param event A `first-contribution` event.
 * @returns Text that can be used as comment.
 */
function get_msg_input(event: FCEvent): string {
  const message_inputs = [
    'issue-opened-msg',
    'issue-completed-msg',
    'issue-not-planned-msg',
    'pr-opened-msg',
    'pr-merged-msg',
    'pr-closed-msg'
  ]
  let msg = core.getInput(`${event.name}-${event.state}-msg`).trim()
  if (message_inputs.includes(msg)) {
    msg = core.getInput(msg).trim()
  }
  return msg
}
