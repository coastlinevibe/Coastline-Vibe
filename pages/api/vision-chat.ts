import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File as FormidableFile, Fields, Files } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: NextApiRequest): Promise<{ image?: Buffer; prompt: string }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err: any, fields: Fields, files: Files) => {
      if (err) return reject(err);
      const prompt = fields.prompt as string || '';
      const imageFile = files.image as FormidableFile;
      if (!imageFile) return resolve({ prompt }); // No image uploaded
      fs.readFile(imageFile.filepath, (err, data) => {
        if (err) return reject(err);
        resolve({ image: data, prompt });
      });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { image, prompt } = await parseForm(req);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Missing OpenAI API key' });
      return;
    }
    let response, data;
    if (image) {
      // With image: use GPT-4 Vision
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: 'data:image/jpeg;base64,' + image.toString('base64') },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });
      data = await response.json();
      res.status(200).json({ reply: data.choices?.[0]?.message?.content || '' });
    } else {
      // No image: use GPT-4 (text only)
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
        }),
      });
      data = await response.json();
      res.status(200).json({ reply: data.choices?.[0]?.message?.content || '' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: (error as Error).message });
  }
} 