export async function sendContactNotification({
  email,
  name,
  message,
  language = 'ja',
  webhookUrl,
}) {
  if (!webhookUrl) {
    throw new Error('Slack webhook is not configured on the server.')
  }

  if (!email || !name || !message) {
    throw new Error('Missing required fields.')
  }

  const text = [
    '*問い合わせが入りました*',
    `*氏名:* ${name}`,
    `*メールアドレス:* ${email}`,
    `*言語:* ${language}`,
    '*内容:*',
    message,
  ].join('\n')

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
    }),
  })

  const resultText = await response.text().catch(() => '')

  if (!response.ok) {
    throw new Error(resultText || 'Failed to send Slack notification.')
  }

  return { ok: true }
}
