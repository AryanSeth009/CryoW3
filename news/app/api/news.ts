import { NextApiRequest, NextApiResponse } from "next";

const fetchNews = async (query: string) => {
  const API_KEY = process.env.NEWS_API_KEY; // Private key (not exposed to the client)

  const response = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&apiKey=${API_KEY}&pageSize=24`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch news");
  }

  return await response.json();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const data = await fetchNews(query);
    res.status(200).json(data.articles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
