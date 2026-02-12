# Tests Report

![Tests badge](tests-badge.svg)

## Summary

- **Total Tests**: 56
- **Test Suites**: 35
- **Duration**: 913ms

| Status | File                                                                                           | Tests |  ✅  |  ❌  |  ⏭️ |   ⏳  |
| :----: | :--------------------------------------------------------------------------------------------- | :---: | :-: | :-: | :-: | :--: |
|    ✅   | [tests/index.test.ts](#-testsindextestts)                                                      |   1   |  1  |  -  |  -  |  5ms |
|    ✅   | [tests/issues.test.ts](#-testsissuestestts)                                                    |   3   |  3  |  -  |  -  |  4ms |
|    ✅   | [tests/main.test.ts](#-testsmaintestts)                                                        |   7   |  7  |  -  |  -  | 10ms |
|    ✅   | [tests/pull_request.test.ts](#-testspull_requesttestts)                                        |   5   |  5  |  -  |  -  | 10ms |
|    ✅   | [tests/utils/action-inputs.test.ts](#-testsutilsaction-inputstestts)                           |   9   |  9  |  -  |  -  |  6ms |
|    ✅   | [tests/utils/add-labels.test.ts](#-testsutilsadd-labelstestts)                                 |   3   |  3  |  -  |  -  |  2ms |
|    ✅   | [tests/utils/add-reactions.test.ts](#-testsutilsadd-reactionstestts)                           |   6   |  6  |  -  |  -  | 10ms |
|    ✅   | [tests/utils/create-comment.test.ts](#-testsutilscreate-commenttestts)                         |   2   |  2  |  -  |  -  |  2ms |
|    ✅   | [tests/utils/fc-event.test.ts](#-testsutilsfc-eventtestts)                                     |   6   |  6  |  -  |  -  |  2ms |
|    ✅   | [tests/utils/is-first-time-contributor.test.ts](#-testsutilsis-first-time-contributortestts)   |   8   |  8  |  -  |  -  |  4ms |
|    ✅   | [tests/utils/is-supported-event.test.ts](#-testsutilsis-supported-eventtestts)                 |   1   |  1  |  -  |  -  |  1ms |
|    ✅   | [tests/utils/was-the-first-contribution.test.ts](#-testsutilswas-the-first-contributiontestts) |   5   |  5  |  -  |  -  |  7ms |

## Details

### ✅ tests/index.test.ts

```txt
  ✅ calls run when imported

```

### ✅ tests/issues.test.ts

```txt
  ✅ handles when a new issue is opened

  ✅ handles when an issue is closed as completed
  ✅ handles when an issue is closed as not planned

```

### ✅ tests/main.test.ts

```txt
  ✅ exits action when the triggered event is NOT supported
  ✅ exits action when the issue or pull request author is NOT a first-time contributor
  ✅ sets the correct action's outputs for issues
  ✅ sets the correct action's outputs for pull requests

  ✅ fails the action when `fail-on-error` is true
  ✅ logs an error without failing when `fail-on-error` is false
  ✅ logs an error when something other than an Error is thrown

```

### ✅ tests/pull_request.test.ts

```txt
  ✅ handles when a new pull request is opened

  ✅ handles when a pull request is merged
  ✅ handles when a pull request is closed WITHOUT being merged
  ✅ comments when the FIRST of two PRs is closed
  ✅ does NOT comment when a NON-FIRST PR is closed

```

### ✅ tests/utils/action-inputs.test.ts

```txt
  ✅ returns the correct labels for `-labels` inputs
  ✅ returns fallback (if any) when a specific `-labels` input is unavailable
  ✅ returns an empty array when no `-labels` input is provided

  ✅ returns the correct messages for all `-msg` inputs
  ✅ returns a correct message when `-msg` input is 'symlinked'
  ✅ trims leading/trailing whitespace and line terminator characters in `-msg` inputs

  ✅ returns the correct values for `-reactions` inputs
  ✅ returns fallback (if any) when a specific `-reactions` input is unavailable
  ✅ returns an empty array when no `-reactions` input is provided

```

### ✅ tests/utils/add-labels.test.ts

```txt
  ✅ adds labels to a new issue or pull request
  ✅ does not add labels when the list of labels is empty
  ✅ does not add labels when the event payload action is NOT `opened`

```

### ✅ tests/utils/add-reactions.test.ts

```txt
  ✅ does nothing if the reactions array is empty
  ✅ does NOT add reactions on 'closed' events
  ✅ adds a single, valid reaction
  ✅ adds multiple, valid reactions
  ✅ warns but continues if some of the reactions are invalid
  ✅ does not error if all reactions are invalid

```

### ✅ tests/utils/create-comment.test.ts

```txt
  ✅ comments on an issue or pull request
  ✅ does not comment when the input message is empty

```

### ✅ tests/utils/fc-event.test.ts

```txt
  ✅ identifies an opened issue
  ✅ identifies an opened pull request
  ✅ identifies a completed issue
  ✅ identifies a not-planned issue
  ✅ identifies a merged pull request
  ✅ identifies a closed (unmerged) pull request

```

### ✅ tests/utils/is-first-time-contributor.test.ts

```txt
  ✅ returns false immediately if the user has a commit history
  ✅ proceeds to check issues/PRs if the user has no commit history

  ✅ returns true if the user has only one contribution (issue or PR)
  ✅ returns false if the user has multiple contributions

  ✅ returns true for a first issue, even with a prior PR
  ✅ returns false for a subsequent issue
  ✅ returns true for a first PR, even with a prior issue
  ✅ returns false for a subsequent PR

```

### ✅ tests/utils/is-supported-event.test.ts

```txt
  ✅ determines whether the triggered event is supported or not

```

### ✅ tests/utils/was-the-first-contribution.test.ts

```txt
  ✅ returns true if the closed PR is the first and only one
  ✅ returns true if the closed PR is the first of several
  ✅ returns false if the closed PR is NOT the first
  ✅ correctly handles issues
  ✅ returns false if no contributions are found

```
