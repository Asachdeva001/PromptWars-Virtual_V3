/**
 * Google Cloud Function API Endpoint for GreenPulse AI
 * Integrates Vertex AI (Gemini) and Firestore.
 */

import { VertexAI } from '@google-cloud/vertexai';
import { Firestore } from '@google-cloud/firestore';
import corsLib from 'cors';

const cors = corsLib({ origin: true });

// Initialize Firestore with a safe fallback for local/local-test runtimes
let db;
try {
  db = new Firestore();
} catch (err) {
  console.warn("Firestore client load warning (running offline fallback):", err.message);
}

// In-memory fallback DB for local development if GCP Firestore is unconfigured
const memoryDB = {
  logs: [],
  profile: { name: 'Eco Citizen', carbonGoal: 3000, region: 'Global Average' }
};

/**
 * HTTP Cloud Function Entry Point
 * @param {Object} req - Cloud Function Request
 * @param {Object} res - Cloud Function Response
 */
export const api = (req, res) => {
  return cors(req, res, async () => {
    try {
      const method = req.method;
      const path = req.path || '/';

      // 1. GET /logs - Fetch all carbon logs
      if (method === 'GET' && path.includes('/logs')) {
        let logsList = [];
        try {
          if (db) {
            const snapshot = await db.collection('logs').orderBy('timestamp', 'desc').get();
            snapshot.forEach(doc => {
              logsList.push({ id: doc.id, ...doc.data() });
            });
          } else {
            logsList = [...memoryDB.logs].sort((a, b) => b.timestamp - a.timestamp);
          }
        } catch (dbError) {
          console.warn("Firestore DB not available, running in-memory fallback:", dbError.message);
          logsList = [...memoryDB.logs].sort((a, b) => b.timestamp - a.timestamp);
        }
        return res.status(200).json({ success: true, logs: logsList });
      }

      // 2. POST /logs - Add a new carbon log
      if (method === 'POST' && path.includes('/logs')) {
        const logData = req.body;
        if (!logData.category || !logData.subcategory || logData.rawValue === undefined) {
          return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        const logEntry = {
          timestamp: logData.timestamp || Date.now(),
          date: logData.date || new Date().toISOString().split('T')[0],
          category: logData.category,
          subcategory: logData.subcategory,
          rawValue: Number(logData.rawValue),
          carbon: Number(logData.carbon),
          notes: String(logData.notes || '')
        };

        let newId = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        try {
          if (db) {
            const docRef = await db.collection('logs').add(logEntry);
            newId = docRef.id;
          } else {
            logEntry.id = newId;
            memoryDB.logs.push(logEntry);
          }
        } catch (dbError) {
          console.warn("Firestore DB add failed, running in-memory fallback:", dbError.message);
          logEntry.id = newId;
          memoryDB.logs.push(logEntry);
        }

        return res.status(201).json({ success: true, id: newId, log: logEntry });
      }

      // 3. DELETE /logs/:id - Delete a log by ID
      if (method === 'DELETE' && path.includes('/logs/')) {
        const parts = path.split('/');
        const logId = parts[parts.length - 1];
        if (!logId) {
          return res.status(400).json({ success: false, error: "Missing log ID" });
        }

        try {
          if (db) {
            await db.collection('logs').doc(logId).delete();
          } else {
            memoryDB.logs = memoryDB.logs.filter(l => l.id !== logId);
          }
        } catch (dbError) {
          console.warn("Firestore DB delete failed, running in-memory fallback:", dbError.message);
          memoryDB.logs = memoryDB.logs.filter(l => l.id !== logId);
        }
        return res.status(200).json({ success: true, message: `Deleted log ${logId}` });
      }

      // 4. POST /chat - Chat assistant powered by Vertex AI (Gemini)
      if (method === 'POST' && path.includes('/chat')) {
        const { message, history = [] } = req.body;
        if (!message) {
          return res.status(400).json({ success: false, error: "Message is required" });
        }

        // Try calling GCP Vertex AI Gemini model
        try {
          // Initialize Vertex AI with standard project details.
          // VertexAI automatically resolves the local GCP credentials/project.
          const project = process.env.GCP_PROJECT || 'greenpulse-ai';
          const location = process.env.GCP_LOCATION || 'us-central1';
          
          const vertexAI = new VertexAI({ project, location });
          const generativeModel = vertexAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
              maxOutputTokens: 256,
              temperature: 0.7
            },
            systemInstruction: "You are GreenPulse Eco-AI, a helpful, encouraging sustainability assistant. " +
                               "Your goal is to guide users to track, measure, and lower their carbon footprint. " +
                               "Format responses in friendly text. If the user shares travel, energy, food, or shopping " +
                               "quantities, encourage them to confirm log values."
          });

          // Translate history array format to Vertex AI format if necessary
          const chatSession = generativeModel.startChat({
            history: history.map(h => ({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            }))
          });

          const result = await chatSession.sendMessage(message);
          const responseText = result.response.candidates[0].content.parts[0].text;

          return res.status(200).json({ success: true, reply: responseText });
        } catch (vertexError) {
          console.error("Vertex AI connection failed. Running rule-based chatbot fallback:", vertexError.message);
          
          // Fallback static smart response if Vertex AI environment is not set up
          let fallbackReply = `I received your message: "${message}". Currently running offline, but you can say 'help' to see formatting tips to log carbon entries!`;
          if (message.toLowerCase().includes('help')) {
            fallbackReply = "You can track your footprint by saying: 'I drove 15 miles in my EV', 'ate beef burger', or 'electricity bill was 200 kWh'.";
          } else if (message.toLowerCase().includes('score') || message.toLowerCase().includes('stats')) {
            fallbackReply = "Check your personal gauge score on the left panel to review your carbon metrics progress!";
          }
          
          return res.status(200).json({ success: true, reply: fallbackReply, fallback: true });
        }
      }

      // Default fallback
      return res.status(404).json({ error: "Endpoint not found" });

    } catch (err) {
      console.error("Internal Server Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
};
