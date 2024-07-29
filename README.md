# first-contribution

[![GitHub Super-Linter](https://github.com/plbstl/first-contribution/actions/workflows/linter.yml/badge.svg)](https://github.com/plbstl/first-contribution/actions/workflows/linter.yml)
![Tests](https://github.com/plbstl/first-contribution/actions/workflows/tests.yml/badge.svg)
[![Check dist/](https://github.com/plbstl/first-contribution/actions/workflows/check-dist.yml/badge.svg)](https://github.com/plbstl/first-contribution/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/plbstl/first-contribution/actions/workflows/codeql.yml/badge.svg)](https://github.com/plbstl/first-contribution/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

Automatically respond to a user's first issue or pull request in your repository.

## Usage

You can respond to first-time contributors when they open new issues and pull requests. You can also respond when those
opened issues and pull requests are closed.

- All inputs are optional.
- All inputs have no default values (except for `token` which defaults to `{{ github.token }}`).
- If the relevant message is empty, no comment will be made.
- If no labels are provided, the issue or pull request labels will remain untouched.

### Notes

- Labels are only added to new issues and pull requests.
- You can use `{fc-author}` in any of the `-msg` inputs to reference the issue or pull request author.
- You can reuse messages by passing the input parameter name instead. See the [Detailed example](#detailed) for more
  information.

### Inputs 📥

```yaml
- uses: plbstl/first-contribution@v3
  with:
    # The GitHub access token (e.g. secrets.GITHUB_TOKEN)
    # used to add relevant comments and labels.
    # This defaults to {{ github.token }}.
    token: ${{ env.GITHUB_TOKEN }}

    # Message to reply a first-time contributor with,
    # when they open a new issue.
    issue-opened-msg: |
      Markdown

    # Message to reply a first-time contributor with,
    # when they open a new pull request.
    pr-opened-msg: |
      Markdown

    # Message to reply a first-time contributor with,
    # when their authored issue is CLOSED AS COMPLETED.
    issue-completed-msg: |
      Markdown

    # Message to reply a first-time contributor with,
    # when their authored issue is CLOSED AS NOT_PLANNED.
    issue-not-planned-msg: |
      Markdown

    # Message to reply a first-time contributor with,
    # when their authored pull request is MERGED.
    pr-merged-msg: |
      Markdown

    # Message to reply a first-time contributor with,
    # when their authored pull request is CLOSED without
    # being merged.
    pr-closed-msg: |
      Markdown

    # Comma-separated list of labels that should be added
    # to an issue or pull request opened by a first-time
    # contributor.
    labels: label1, label2

    # Comma-separated list of labels that should be added
    # to an issue authored by a first-time contributor.
    # Takes precedence over the 'labels' input.
    issue-labels: label1, label2

    # Comma-separated list of labels that should be added
    # to a pull request authored by a first-time contributor.
    # Takes precedence over the 'labels' input.
    pr-labels: label1, label2
```

> [!IMPORTANT]
>
> Make sure to listen to the necessary events, and grant the needed permissions for the different action inputs.

You can check out the [examples below](#examples).

### Outputs 📤

first-contribution GitHub Action provides the following outputs:

| Output        | Type    | Description                                                                                                                                                |
| ------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`        | string  | Where the first contribution was made. `issue` or `pr`.                                                                                                    |
| `number`      | integer | Unique number of the issue or pull request.                                                                                                                |
| `username`    | string  | GitHub username of the first-time contributor.                                                                                                             |
| `comment-url` | string  | URL to the comment that was made in response to the user's first contribution. This will be empty if no comment was made (e.g. you're only adding labels). |

## Examples

- [Add new contributor](#add-new-contributor)
- [Welcome first-time issues and PRs](#welcome-first-time-issues-and-prs)
- [Detailed](#detailed)

### Add new contributor

Add a new contributor after PR merge, using the [@all-contributors bot](https://github.com/apps/allcontributors).

```yaml
name: Add new contributor

on:
  pull_request_target:
    types: closed

jobs:
  add-contributor:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@v3
        with:
          pr-merged-msg: >
            @all-contributors please add @{fc-author} for ${{ join(github.event.pull_request.labels.*.name, ', ') }}
```

### Welcome first-time issues and PRs

Welcome first-time contributors when they open new issues and pull requests. Also label the opened issue or PR.

```yaml
name: Welcome a first-time contributor

on:
  issues:
    types: opened
  pull_request_target:
    types: opened

jobs:
  welcome-first-time-contributor:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@v3
        with:
          labels: first contrib
          issue-opened-msg: |
            ### Hey @{fc-author} !

            Looks like it's your first time interacting with (Project Name) here on GitHub.

            Welcome and thank you for taking the time to report an issue :heart:.

            Please check out our [code of conduct](https://github.com/user/repo/blob/main/CODE_OF_CONDUCT.md) to learn how to interact with the community.

            Don't forget to star :star: the repo.
          pr-opened-msg: |
            ### Hey @{fc-author} !

            Thank you for taking the time to contribute to (Project Name). Your help is truly appreciated :heart:.

            Please check out the [contribution guide](https://github.com/user/repo/blob/main/CONTRIBUTING.md) which is very useful for working on pull requests.

            Don't forget to star :star: the repo.
```

### Detailed

- Add relevant labels to issues and pull requests opened by first-time contributors.
- Welcome first-time contributors when they open new issues and pull requests.
- Comment on closed issues and pull requests, when the author is a first-time contributor.
- Reuse text from other inputs.

```yaml
name: Welcome a first-time contributor

on:
  issues:
    types: [opened, closed]
  pull_request_target:
    types: [opened, closed]

jobs:
  welcome-first-time-contributor:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: plbstl/first-contribution@v3
        with:
          labels: first-timer, new contributor
          pr-labels: pr, first-contribution
          # reuse message text by using the input parameter name. If the reused text is empty, nothing happens.
          # New pull request is OPENED.
          pr-opened-msg: issue-opened-msg
          # Authored pull request is MERGED.
          pr-merged-msg: issue-completed-msg
          # Authored pull request is CLOSED without being merged.
          pr-closed-msg: issue-not-planned-msg
          # messages
          issue-opened-msg: |
            ### Hey @{fc-author}!

            Looks like it's your first time interacting with (Project Name) here on GitHub.

            Welcome and thank you for taking the time to report an issue :heart:.

            Please check out our [code of conduct](https://github.com/user/repo/blob/main/CODE_OF_CONDUCT.md) and [contribution guide](https://github.com/user/repo/blob/main/CONTRIBUTING.md) to learn how to interact with and contribute to the community.

            Don't forget to star :star: the repo.
          issue-completed-msg: |
            ### Hey @{fc-author}!

            Thank you for your contribution, feel free to come by anytime.
          issue-not-planned-msg: |
            ### Hey @{fc-author}!

            Thank you for taking the time to make a contribution, don't let this stop you from reaching out again.
```
