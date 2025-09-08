import type { WebhookPayload } from '@actions/github/lib/interfaces.d.ts'

/**
 * Creates and returns a new `first-contribution` event.
 * @param payload Webhook payload of the triggered event.
 */
export function get_fc_event(payload_action: 'opened' | 'closed', payload: WebhookPayload): FCEvent {
  let action_type: FCEvent['state'] = 'opened'

  if (payload_action === 'closed') {
    if (payload.pull_request) {
      // This is a pull request.
      action_type = payload.pull_request.merged ? 'merged' : 'closed'
    } else {
      // This is an issue.
      action_type = payload.issue?.state_reason === 'completed' ? 'completed' : 'not-planned'
    }
  }

  return {
    state: action_type,
    name: payload.pull_request ? 'pr' : 'issue'
  }
}

/** `first-contribution` custom event. */
export interface FCEvent {
  /** Where the event occurred. */
  name: 'issue' | 'pr'
  /** The current state of the event. */
  state: 'opened' | 'completed' | 'not-planned' | 'merged' | 'closed'
}
