import { sendContactNotification } from './contact-shared.js'

const SLACK_WEBHOOK_URL = process.env.SLACK_FEEDBACK_WEBHOOK_URL

function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(payload))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  if (!SLACK_WEBHOOK_URL) {
    return json(res, 500, {
      error: 'Slack webhook is not configured on the server.',
    })
  }

  const { email, name, message, language } = req.body || {}

  try {
    const result = await sendContactNotification({
      email,
      name,
      message,
      language,
      webhookUrl: SLACK_WEBHOOK_URL,
    })

    return json(res, 200, result)
  } catch (error) {
    const status = error?.message === 'Missing required fields.' ? 400 : 500
    return json(res, status, {
      error: error?.message || 'Unexpected error while sending Slack notification.',
    })
  }
}
