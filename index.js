const core = require('@actions/core')
const github = require('@actions/github')

const slackifyMarkdown = require(`slackify-markdown`)
const { WebClient } = require('@slack/web-api')

try {

  const slack = new WebClient(secrets.SLACK_BOT_TOKEN)

  const message = {
    channel: core.getInput('channel'),
    blocks: [{
      type: "section",
      text: {
        type: "plain_text",
        text: `:rocket: ${core.getInput('app-name') || 'Some'} Update`,
        emoji: true,
      },
    }]
  }

  const result = await github.repos.listPullRequestsAssociatedWithCommit({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    commit_sha: github.context.sha,
  })

  console.log(result.data)

  if (result.data.length > 0) {
    const pr = result.data[0]
    const contextElements = []
    
    const labels = pr.labels.map(label => label.name).join(",")

    if (labels) {
      contextElements.push({
        "type": "mrkdwn",
        "text": labels,
      })
    }

    contextElements.push({
      "type": "mrkdwn",
      "text": `${pr.user.login} <${pr.html_url}|#${pr.number}>`,
    })

    message.attachments = [{
      color: "#009900",
      blocks: [{
        type: "header",
        text: {
          type: "plain_text",
          text: pr.title,
        },
      }, {
        type: "section",
        text: {
          type: "mrkdwn",
          text: slackifyMarkdown(pr.body),
        },
      }, {
        type: "context",
        elements: contextElements,
      }]
    }]

    await slack.chat.postMessage(message)
  }

} catch (error) {
  core.setFailed(error.message)
}