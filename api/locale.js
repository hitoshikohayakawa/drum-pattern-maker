function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(payload))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  const country = String(
    req.headers['x-vercel-ip-country'] ||
    req.headers['x-country-code'] ||
    req.headers['cf-ipcountry'] ||
    ''
  ).toUpperCase()

  return json(res, 200, {
    country,
    language: country === 'JP' ? 'ja' : 'en',
  })
}