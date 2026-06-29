const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const router = express.Router();

// POST /api/ai/generate - Used for one-off content generation (Resume, Daily Brief)
router.post('/generate', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { contents } = req.body;
    
    if (!contents) {
      return res.status(400).json({ error: "Missing 'contents' in request body." });
    }

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: contents
    });

    res.json({ text: result.text });
  } catch (error) {
    console.error("AI Generate Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI content" });
  }
});

// POST /api/ai/chat - Used for streaming chat responses using SSE
router.post('/chat', async (req, res) => {
  const { contents, systemInstruction } = req.body;
  if (!contents) {
    return res.status(400).json({ error: "Missing 'contents' in request body." });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Necessary for CORS and proxies
  res.flushHeaders();

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.1-flash-lite",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error("AI Chat Stream Error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message || "Stream failed" })}\n\n`);
    res.end();
  }
});

module.exports = router;
