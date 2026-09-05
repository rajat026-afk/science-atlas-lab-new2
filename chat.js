export default async function handler(req, res) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  for (const [key, value] of Object.entries(cors)) res.setHeader(key, value);

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST /api/chat." });
  }

  try {
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res.status(400).json({ error: "Please enter a science question." });
    }

    if (message.length > 8000) {
      return res.status(400).json({ error: "Question is too long. Keep it under 8000 characters." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing from Vercel Environment Variables."
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        instructions:
          "You are Science Atlas AI, the scientific tutor inside Science Atlas Lab. " +
          "Answer questions about biology, physics, chemistry, Earth and space science, " +
          "mathematics, technology, and interdisciplinary science. Be accurate, clear, " +
          "educational and curious. Explain important vocabulary and reasoning when useful. " +
          "Do not invent facts or sources.",
        input: message,
        max_output_tokens: 1200
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || `OpenAI returned HTTP ${upstream.status}.`
      });
    }

    return res.status(200).json({
      answer: data?.output_text || "No answer was returned."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "The AI server could not process the request."
    });
  }
}
