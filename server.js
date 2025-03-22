import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Check if API key is set
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: '❌ Message is required' });
    }

    // Set the correct model name (use "gemini-2.0-flash" or "gemini-1.5-pro" if needed)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 800,
      }
    });

    // Format chat history
    const formattedHistory = history?.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    })) || [];

    // Construct the conversation
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: "You are SmartInvest Assistant, a helpful AI specializing in investment advice. Keep responses focused on financial topics." }]
        },
        ...formattedHistory,
        {
          role: "user",
          parts: [{ text: message }]
        }
      ]
    });

    // Extract response
    const response = result.response;
    if (!response) {
      throw new Error('Empty response from Gemini API');
    }

    const responseText = response.text();
    res.json({ response: responseText });

  } catch (error) {
    console.error('❌ Chat API Error:', error);

    // Send specific error messages
    if (error.message?.includes('API_KEY_INVALID')) {
      res.status(500).json({ error: 'Invalid API key configuration' });
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      res.status(500).json({ error: 'API key permission denied' });
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      res.status(500).json({ error: 'API quota exceeded' });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
