/**
 * Checks whether the triggered event is supported by first-contribution GitHub Action.
 * @param eventName Name of the triggered event.
 * @param [action] Action that caused the event to trigger.
 * @returns
 */
export function isSupportedEvent(eventName: string, action?: string): action is 'opened' | 'closed' {
  const eventCode = `${eventName}.${action}`
  const supportedEventCodes = [
    'issues.opened',
    'issues.closed',
    'pull_request.opened',
    'pull_request.closed',
    'pull_request_target.opened',
    'pull_request_target.closed'
  ]
  return supportedEventCodes.includes(eventCode)
}
