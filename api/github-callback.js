export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const { code } = req.body
  const client_id = process.env.GITHUB_CLIENT_ID
  const client_secret = process.env.GITHUB_CLIENT_SECRET

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id, client_secret, code })
  })
  const data = await response.json()
  res.status(200).json(data)
}