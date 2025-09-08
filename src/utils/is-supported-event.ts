/**
 * Checks whether the triggered event is supported by first-contribution GitHub Action.
 * @param event_name Name of the triggered event.
 * @param [action] Action that caused the event to trigger.
 * @returns
 */
export function is_supported_event(event_name: string, action?: string): action is 'opened' | 'closed' {
  const event_code = `${event_name}.${String(action)}`
  const supported_event_codes = [
    'issues.opened',
    'issues.closed',
    'pull_request.opened',
    'pull_request.closed',
    'pull_request_target.opened',
    'pull_request_target.closed'
  ]
  return supported_event_codes.includes(event_code)
}
