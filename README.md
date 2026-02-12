# First Contribution

[![GitHub Release](https://img.shields.io/github/v/release/plbstl/first-contribution)](https://github.com/marketplace/actions/first-contribution)
[![CI](https://github.com/plbstl/first-contribution/actions/workflows/ci.yml/badge.svg)](https://github.com/plbstl/first-contribution/actions/workflows/ci.yml)
[![CodeQL](https://github.com/plbstl/first-contribution/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/plbstl/first-contribution/actions/workflows/github-code-scanning/codeql)
[![Tests](./assets/tests-badge.svg)](./assets/tests-report.md)
[![Coverage](./assets/coverage-badge.svg)](./assets/coverage-report.md)
[![jscpd](./assets/jscpd-badge.svg)](./assets/jscpd-report.md)
[![License](https://img.shields.io/github/license/plbstl/first-contribution)](./LICENSE)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fplbstl%2Ffirst-contribution.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fplbstl%2Ffirst-contribution?ref=badge_shield&issueType=license)
[![FOSSA Security](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fplbstl%2Ffirst-contribution.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Fplbstl%2Ffirst-contribution?ref=badge_shield&issueType=security)

Automatically welcome first-time contributors on issues and pull requests.

## Quick Start

Create `.github/workflows/welcome.yml` and paste:

```yaml
name: Welcome first-time contributor

on:
  issues:
    types: opened
  pull_request_target:
    types: opened

jobs:
  welcome:
    runs-on: ubuntu-latest
    permissions:
      issues: write # Only needed when adding comments and labels on issues
      pull-requests: write # Only needed when adding comments and labels on PRs
    steps:
      - uses: plbstl/first-contribution@4b2b042fffa26792504a18e49aa9543a87bec077 # v4.1.0
        with:
          issue-opened-msg: |
            Hey @{fc-author} 👋

            Thanks for opening your first issue. Welcome!
          pr-opened-msg: |
            Hey @{fc-author} 🎉

            Thanks for your first pull request. We appreciate it.
```

That's all you need.

<p align="center">
<img src="./assets/issue-opened.jpg" width="650" alt="Example reply for when a first-timer opens an issue"/>
</p>

## What it does

- Welcomes first-time issue authors and PR authors
- Lets you customize messages for open, merge, and close events
- Adds labels and emoji reactions
- Detects real first-time contributors (checks commit history too)

## Configuration

### Inputs

| Input                   | Description                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `token`                 | GitHub token for API access. [Default: github.token]                                                      |
| `issue-opened-msg`      | Message for a first-time issue                                                                            |
| `pr-opened-msg`         | Message for a first-time PR                                                                               |
| `issue-completed-msg`   | Message when a first-time issue is closed as completed                                                    |
| `issue-not-planned-msg` | Message when a first-time issue is closed as not planned                                                  |
| `pr-merged-msg`         | Message when a first-time PR is merged                                                                    |
| `pr-closed-msg`         | Message when a first-time PR is closed (not merged)                                                       |
| `labels`                | Labels to add (comma separated)                                                                           |
| `issue-labels`          | Labels for issues (overrides labels)                                                                      |
| `pr-labels`             | Labels for PRs (overrides labels)                                                                         |
| `contribution-mode`     | `once` to greet only on a user’s absolute first interaction. [Default: greet on first issue and first PR] |
| `fail-on-error`         | Fail the workflow if an error occurs. [Default: false]                                                    |
| `reactions`             | Reactions to add (comma separated)                                                                        |
| `issue-reactions`       | Reactions for issues (overrides reactions)                                                                |
| `pr-reactions`          | Reactions for PRs (overrides reactions)                                                                   |

> [!NOTE]
>
> `labels` and `reactions` are only applied when a contribution is **opened**.

### Outputs

| Output        | Description               |
| ------------- | ------------------------- |
| `type`        | `issue` or `pr`           |
| `number`      | Issue or PR number        |
| `username`    | Contributor's username    |
| `comment-url` | URL of the posted comment |

## Examples

### Reactions

```yaml
- uses: plbstl/first-contribution@4b2b042fffa26792504a18e49aa9543a87bec077 # v4.1.0
  with:
    issue-reactions: eyes
    pr-reactions: +1, rocket
```

### Greet Only Once

```yaml
- uses: plbstl/first-contribution@4b2b042fffa26792504a18e49aa9543a87bec077 # v4.1.0
  with:
    contribution-mode: once
    issue-opened-msg: >
      Welcome @{fc-author}! Thanks for your first contribution ❤️
    pr-opened-msg: issue-opened-msg
```

### After Merge (all-contributors)

```yaml
name: Add new contributor

on:
  pull_request_target:
    types: closed

jobs:
  add-contributor:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@4b2b042fffa26792504a18e49aa9543a87bec077 # v4.1.0
        with:
          pr-merged-msg: >
            @all-contributors please add @{fc-author} for ${{ join(github.event.pull_request.labels.*.name, ', ') }}
```

### Advanced Configuration

```yaml
name: First contribution flow

on:
  issues:
    types: [opened, closed]
  pull_request_target:
    types: [opened, closed]

jobs:
  process:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@4b2b042fffa26792504a18e49aa9543a87bec077 # v4.1.0
        with:
          issue-labels: first-issue, needs-triage
          pr-labels: first-pr, needs-review
          issue-reactions: eyes
          pr-reactions: +1

          # Reuse message text by referencing another input field
          pr-opened-msg: issue-opened-msg

          issue-opened-msg: |
            Hey @{fc-author}!

            Looks like this is your first interaction with this repository.
            Thanks for contributing.

          pr-merged-msg: |
            @{fc-author}

            Your first PR was merged. Thank you!
```

## Security

This action uses `pull_request_target` so it can comment on PRs from forks.

That is safe **as long as you do not check out untrusted code from the PR**.

Safe:

```yaml
- uses: actions/checkout@commit-sha # v6.x.x
```

Unsafe:

```yaml
- uses: actions/checkout@commit-sha # v6.x.x
  with:
    ref: ${{ github.event.pull_request.head.sha }}
```

Never check out `github.event.pull_request.head.sha` inside a `pull_request_target` workflow.
