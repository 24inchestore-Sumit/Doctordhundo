export const maxDuration = 60;

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, imageBase64, imageType } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    let messageContent;

    if (imageBase64 && imageType) {
      if (imageType.startsWith('image/')) {
        messageContent = [
          {
            type: 'image',
            source: { type: 'base64', media_type: imageType, data: imageBase64 }
          },
          { type: 'text', text: prompt }
        ];
      } else if (imageType === 'application/pdf') {
        messageContent = [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: imageBase64 }
          },
          { type: 'text', text: prompt }
        ];
      } else {
        messageContent = prompt;
      }
    } else {
      messageContent = prompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: messageContent }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: 'Anthropic API error', details: err });
    }

    const data = await response.json();

    /* Return the raw text so frontend can parse it */
    const rawText = data.content?.[0]?.text || '';
    return res.status(200).json({ raw: rawText });

  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}
