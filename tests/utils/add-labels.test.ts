/**
 * Unit tests for the action's `add_labels` util.
 */

import { describe, expect, it } from 'vitest'
import { add_labels } from '~src/utils/index.ts'
import { octokit } from '~tests/helpers.ts'
import { octokit_addLabels_mock } from '~tests/setup.ts'

describe('add_labels()', () => {
  it('adds labels to a new issue or pull request', async () => {
    const add_labels_opts = {
      issue_number: 1,
      labels: ['first label', 'label2'],
      owner: 'owner',
      repo: 'repo'
    }

    const did_add_labels = await add_labels(octokit, 'opened', add_labels_opts)
    expect(octokit_addLabels_mock).toHaveBeenCalledExactlyOnceWith(add_labels_opts)
    expect(did_add_labels).toBe(true)
  })

  it('does not add labels when the list of labels is empty', async () => {
    const add_labels_opts = {
      issue_number: 2,
      labels: [],
      owner: 'owner',
      repo: 'repo'
    }

    const did_add_labels = await add_labels(octokit, 'opened', add_labels_opts)
    expect(octokit_addLabels_mock).not.toHaveBeenCalled()
    expect(did_add_labels).toBe(false)
  })

  it('does not add labels when the event payload action is NOT `opened`', async () => {
    const add_labels_opts = {
      issue_number: 3,
      labels: ['valid list', 'first-timer'],
      owner: 'owner',
      repo: 'repo'
    }

    await add_labels(octokit, 'closed', add_labels_opts)
    expect(octokit_addLabels_mock).not.toHaveBeenCalled()
  })
})
