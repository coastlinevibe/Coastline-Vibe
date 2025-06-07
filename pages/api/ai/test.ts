import type { NextApiRequest, NextApiResponse } from 'next';

type TestResponse = {
  message: string;
  apiKeyConfigured: boolean;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
) {
  // Check if OpenAI API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  const apiKeyConfigured = !!apiKey;
  
  // Send a simple response
  res.status(200).json({
    message: 'API test endpoint is working',
    apiKeyConfigured
  });
} 