import type { NextApiRequest, NextApiResponse } from 'next';
import { corsMiddleware } from '@/lib/init-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply CORS
  await corsMiddleware(req, res);

  const { query } = req.query;
  const API_KEY = process.env.NEWS_API_KEY;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        query as string
      )}&sortBy=publishedAt&apiKey=${API_KEY}&pageSize=24`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ message: errorData.message });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}
