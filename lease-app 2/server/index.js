import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve built React frontend in production
const distPath = path.join(__dirname, "../client/dist");
app.use(express.static(distPath));

// ── AI Auto-fill proxy ──────────────────────────────────────────────────────
app.post("/api/autofill", async (req, res) => {
  const { knownFields, missingFields } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in environment variables." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are helping fill out a California residential lease agreement. Based on the known information, suggest realistic values for the missing fields. Return ONLY a valid JSON object with field IDs as keys and suggested string values. No explanation, no markdown fences, just raw JSON.

Known fields:
${knownFields}

Suggest values for these field IDs:
${missingFields}

Rules:
- For leaseStart and leaseEnd: return YYYY-MM-DD format
- For monthlyRent, securityDeposit, lateFee: return just the number as a string (e.g. "2500")
- For phone numbers: use (XXX) XXX-XXXX format
- Make all suggestions realistic for a California residential lease
- securityDeposit is typically 2x monthlyRent in California
- lateFee is typically $50-$150
- gracePeriod is typically 3-5 days
- rentDueDay is typically "1"
- If propertyAddress is missing but landlordAddress is known, create a nearby but different address`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const text = data.content?.[0]?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const suggestions = JSON.parse(clean);
    res.json({ suggestions });
  } catch (err) {
    console.error("Autofill error:", err);
    res.status(500).json({ error: "Failed to generate suggestions." });
  }
});

// ── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Fallback: serve React app for all other routes ──────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Lease App server running on port ${PORT}`);
});
