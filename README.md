# first-contribution

[![first-contribution CI](https://github.com/plbstl/first-contribution/actions/workflows/ci.yml/badge.svg)](https://github.com/plbstl/first-contribution/actions/workflows/ci.yml)
[![CodeQL](https://github.com/plbstl/first-contribution/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/plbstl/first-contribution/actions/workflows/github-code-scanning/codeql)
[![Tests](./assets/tests-badge.svg)](./assets/tests-report.md)
[![Coverage](./assets/coverage-badge.svg)](./assets/coverage-report.md)
[![jscpd](./assets/jscpd-badge.svg)](./assets/jscpd-report.md)
[![GitHub License](https://img.shields.io/github/license/plbstl/first-contribution)](./LICENSE)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fplbstl%2Ffirst-contribution.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fplbstl%2Ffirst-contribution?ref=badge_shield&issueType=license)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fplbstl%2Ffirst-contribution.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Fplbstl%2Ffirst-contribution?ref=badge_shield&issueType=security)

Automatically respond to a user's first issue or pull request in your repository.

- **Flexible Tracking**: Greet users on their first issue and first pull request separately, or just once on their very
  first interaction.
- **Smart Contributor Detection**: Avoids misidentifying existing repository committers as new by checking their commit
  history in addition to their issue and pull request activity.
- **Custom Messages**: Define unique messages for different events like opening an issue, merging a PR, or closing a
  contribution.
- **Automatic Labeling**: Apply labels to issues and PRs from new contributors to help with triage.
- **Placeholder Support**: Use `{fc-author}` in any message to mention the contributor by their GitHub username.
- **Message Reuse**: Avoid repetition by reusing message content from other inputs.

## Usage

This action identifies a "first-time contributor" by checking for prior issues, pull requests, and commits from a user.
This prevents existing maintainers who may not have opened a PR before from being incorrectly greeted.

You can respond to first-time contributors when they open new issues and pull requests, and you can also respond when
those contributions are closed.

- All inputs are optional.
- If a message input (e.g., `issue-opened-msg`) is not provided, no comment will be made for that event.
- If no label inputs are provided, the issue or pull request labels will remain untouched.
- You can use `{fc-author}` in any of the `-msg` inputs to reference the issue or pull request author's username.
- You can reuse messages by passing another message input's name as the value. See the
  [Detailed example](#detailed-configuration) for more information.

> [!NOTE]
>
> The `labels` inputs (`labels`, `issue-labels`, and `pr-labels`) are only applied when an issue or pull request is
> opened. They do not apply to `closed` events.

<!--  -->

> [!IMPORTANT]
>
> Make sure your workflow is configured to listen to the necessary events and has been granted the required
> `permissions` for the action to function correctly. See the [examples below](#examples).

### Inputs 📥

| Input                   | Description                                                                                                                                                                                                                      | Default               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `token`                 | The GitHub access token used to add comments and labels.                                                                                                                                                                         | `${{ github.token }}` |
| `issue-opened-msg`      | Message to post on a first-time contributor's first issue.                                                                                                                                                                       | `''`                  |
| `pr-opened-msg`         | Message to post on a first-time contributor's first pull request.                                                                                                                                                                | `''`                  |
| `issue-completed-msg`   | Message to post when a first-time contributor's issue is closed as 'completed'.                                                                                                                                                  | `''`                  |
| `issue-not-planned-msg` | Message to post when a first-time contributor's issue is closed as 'not planned'.                                                                                                                                                | `''`                  |
| `pr-merged-msg`         | Message to post when a first-time contributor's pull request is merged.                                                                                                                                                          | `''`                  |
| `pr-closed-msg`         | Message to post when a first-time contributor's pull request is closed without merging.                                                                                                                                          | `''`                  |
| `labels`                | Comma-separated list of labels to add to any issue or PR from a first-time contributor **when opened**.                                                                                                                          | `''`                  |
| `issue-labels`          | Comma-separated list of labels for a first-time issue **when opened**. Takes precedence over `labels`.                                                                                                                           | `''`                  |
| `pr-labels`             | Comma-separated list of labels for a first-time pull request **when opened**. Takes precedence over `labels`.                                                                                                                    | `''`                  |
| `contribution-mode`     | Controls how first contributions are tracked.<br/>- (default): Triggers for a user's first issue AND their first PR separately.<br/>- `once`: Triggers only on the user's absolute first contribution (either an issue OR a PR). | `''`                  |
| `fail-on-error`         | If `true`, the action will fail the workflow step if an error occurs. If `false`, it will log the error without failing the step.                                                                                                | `false`               |
| `reactions`             | A comma-separated list of emoji reactions to add to the issue or PR body.<br/>**Valid options**: `+1`, `-1`, `laugh`, `confused`, `heart`, `hooray`, `rocket`, `eyes`.                                                           | `''`                  |

### Outputs 📤

| Output        | Type    | Description                                                                        |
| ------------- | ------- | ---------------------------------------------------------------------------------- |
| `type`        | string  | The type of contribution. Can be `issue` or `pr`.                                  |
| `number`      | integer | The number of the issue or pull request.                                           |
| `username`    | string  | The GitHub username of the first-time contributor.                                 |
| `comment-url` | string  | The URL of the comment posted by the action. This is empty if no comment was made. |

## How It Works

This action's logic is designed to be specific and predictable, especially in complex scenarios.

### Responding to a Closed First Contribution

The action can respond to both the `opened` and `closed` events of a user's first-ever contribution. This provides a
complete feedback loop: a "welcome" message when the contribution is opened, and a "thank you" message when it is
eventually closed or merged, no matter how much time has passed.

### Stale or Abandoned First Contributions

The action is tied to the **historically first** contribution. Consider this scenario:

1. A new user opens their first PR (PR #1). The action welcomes them.
1. PR #1 is abandoned and never closed.
1. The same user later opens and merges a second PR (PR #2).

In this case, the action will **not** post a "thank you" message when PR #2 is closed. The special `closed` and `merged`
messages are reserved exclusively for the lifecycle of the user's _actual_ first contribution (PR #1).

## Examples

- [Welcome First-Time Contributors (Issues & PRs)](#welcome-first-time-contributors-issues--prs)
- [Welcome a Contributor Only Once](#welcome-a-contributor-only-once)
- [Add New Contributor After Merge](#add-new-contributor-after-merge)
- [Detailed Configuration](#detailed-configuration)
- [Add Reactions to a First Contribution](#add-reactions-to-a-first-contribution)

### Welcome First-Time Contributors (Issues & PRs)

Welcome users when they open their first issue and their first pull request. Also, add a label to each.

```yaml
name: Welcome First-Time Contributor

on:
  issues:
    types: opened
  pull_request_target:
    types: opened

permissions: {}

jobs:
  welcome:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@v4-beta-1
        with:
          labels: first-contribution
          issue-opened-msg: |
            ### Hey @{fc-author}! :wave:
            Thanks for opening your first issue in this project! Welcome to the community. :heart:
          pr-opened-msg: |
            ### Hey @{fc-author}! :tada:
            Thanks for opening your first pull request! We appreciate your contribution.
```

### Welcome a Contributor Only Once

Use `contribution-mode: once` to welcome a user only on their absolute first interaction, whether it's an issue or a PR.

```yaml
name: Welcome a Contributor (Once)

on:
  issues:
    types: opened
  pull_request_target:
    types: opened

permissions: {}

jobs:
  welcome:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@v4-beta-1
        with:
          contribution-mode: once
          issue-opened-msg: >
            Welcome @{fc-author}! Thanks for your first contribution to our project. We're excited to have you here!
            :heart:
          # Reuse the same message for PRs for a consistent welcome
          pr-opened-msg: issue-opened-msg
```

### Add New Contributor After Merge

Add a new contributor after their first PR is merged, using the
[@all-contributors bot](https://github.com/apps/allcontributors).

```yaml
name: Add New Contributor

on:
  pull_request_target:
    types: closed

permissions: {}

jobs:
  add-contributor:
    # This job only runs for merged PRs
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@v4-beta-1
        with:
          pr-merged-msg: >
            @all-contributors please add @{fc-author} for ${{ join(github.event.pull_request.labels.*.name, ', ') }}
```

### Detailed Configuration

- Add different labels for first-time issues and PRs.
- Comment on opened and closed events.
- Reuse message text across different inputs.

```yaml
name: Detailed First Contribution Flow

on:
  issues:
    types: [opened, closed]
  pull_request_target:
    types: [opened, closed]

permissions: {}

jobs:
  process-contribution:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@v4-beta-1
        with:
          issue-labels: first-issue, needs-triage
          pr-labels: first-pr, needs-review

          # Reuse message text by referencing the input parameter name.
          pr-opened-msg: issue-opened-msg
          pr-merged-msg: issue-completed-msg
          pr-closed-msg: issue-not-planned-msg

          # Messages
          issue-opened-msg: |
            ### Hey @{fc-author}!

            Looks like it's your first time interacting with (Project Name) here on GitHub.
            Welcome and thank you for taking the time to report an issue :heart:.

            Please check out our [code of conduct](https://github.com/user/repo/blob/main/CODE_OF_CONDUCT.md) and [contribution guide](https://github.com/user/repo/blob/main/CONTRIBUTING.md) to learn how to interact with and contribute to the community.

            Don't forget to star :star: the repo.
          issue-completed-msg: |
            ### Hey @{fc-author}!

            Thank you for your contribution. We appreciate it and hope to see you again!
          issue-not-planned-msg: |
            ### Hey @{fc-author}!

            Thank you for taking the time to contribute. While this wasn't merged, we value your effort and encourage you to contribute again in the future.
```

### Add Reactions to a First Contribution

Automatically react to a new issue or PR with an emoji.

```yaml
name: Welcome with Reactions

on:
  issues:
    types: opened
  pull_request_target:
    types: opened

permissions: {}

jobs:
  welcome:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@v4-beta-1
        with:
          issue-opened-msg: Welcome, @{fc-author}! Thanks for opening your first issue.
          pr-opened-msg: Thanks for your first PR, @{fc-author}!
          reactions: heart, rocket
```

## Security

To work correctly on pull requests from forks, this action requires the `pull_request_target` event. This is because the
`GITHUB_TOKEN` provided to this event has the necessary write permissions to add comments and labels to your repository.
A token from the standard `pull_request` event is read-only for security reasons and would cause this action to fail.

Using `pull_request_target` grants the workflow a powerful token. A security risk exists if a workflow uses this token
to check out and run untrusted code from a pull request, as that code could steal your secrets.

This action is safe because it avoids this risk entirely. It does **not** check out or run any code from the pull
request. It only interacts with trusted event metadata provided by GitHub (like the PR author's username) to post
comments and labels.

### Best Practices for Your Workflow

When using `pull_request_target` in your workflows, the most important rule is to **never check out untrusted code from
the PR**. The danger is not the `actions/checkout` tool itself, but _what_ code you tell it to check out.

#### ✅ Safe Pattern

This is safe because it checks out your own repository's trusted code from the base branch (e.g., `main`).

```yaml
on:
  pull_request_target:

steps:
  # This checks out YOUR trusted code.
  - uses: actions/checkout@v5

  # This runs a script you trust because it's already in your repo.
  - run: ./scripts/my-trusted-script.sh
```

#### ❌ Dangerous Pattern

This is dangerous because it explicitly checks out the untrusted code submitted in the pull request using the `ref`
property.

```yaml
on:
  pull_request_target:

steps:
  # DANGEROUS: Checks out untrusted code from the PR.
  - uses: actions/checkout@v5
    with:
      ref: ${{ github.event.pull_request.head.sha }}

  # The untrusted code from the PR is now running.
  - run: ./scripts/my-trusted-script.sh
```
