import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large JSON payloads (image base64)
  app.use(express.json({ limit: "50mb" }));

  // API route to analyze image with Gemini
  app.post("/api/analyze-image", async (req, res) => {
    try {
      console.log("[POST /api/analyze-image] Request received.");
      const { mimeType, data } = req.body;
      
      if (!mimeType || !data) {
        console.error("Missing mimeType or data in request.");
        return res.status(400).json({ error: "Missing image data" });
      }
      
      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set.");
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      console.log(`Initializing Gemini. Image format: ${mimeType}, Base64 size: ${data.length} chars`);

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      console.log("Calling Gemini model...");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            text: `Analyze this image for an issue report. Return a JSON object with:
category: one of ["Pothole", "Water Leak", "Garbage", "Streetlight Damage", "Road Damage", "Infrastructure Damage", "Other"]
severity: one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
impactScore: number 1-10
department: suggested department (e.g., Public Works, Sanitation)
summary: one sentence summary
recommendedPriority: one of ["Low", "Normal", "Urgent"]`
          },
          {
            inlineData: { mimeType, data }
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              severity: { type: Type.STRING },
              impactScore: { type: Type.NUMBER },
              department: { type: Type.STRING },
              summary: { type: Type.STRING },
              recommendedPriority: { type: Type.STRING }
            },
            required: ["category", "severity", "impactScore", "department", "summary", "recommendedPriority"]
          }
        }
      });
      
      const text = response.text;
      console.log(`[POST /api/analyze-image] Gemini response:`, text);
      if (!text) {
        console.error("Gemini returned no response text.");
        throw new Error("No response text");
      }
      
      let rawText = text.trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.substring(7);
      } else if (rawText.startsWith("```")) {
        rawText = rawText.substring(3);
      }
      if (rawText.endsWith("```")) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
      
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         rawText = jsonMatch[0];
      }

      try {
        const result = JSON.parse(rawText.trim());
        console.log(`[POST /api/analyze-image] Successfully parsed JSON response. Sending to client.`);
        res.json(result);
      } catch (parseError) {
        console.error("[POST /api/analyze-image] JSON Parse Error:", parseError, "Raw format:", rawText);
        res.status(500).json({ error: "Failed to parse Gemini response: " + parseError.message });
      }
    } catch (error) {
       console.error("[POST /api/analyze-image] Gemini / Network / Request Error. Details:", error.message || error);
       
       const errorMsg = error.message ? error.message.toLowerCase() : "";
       if (error.status === 429 || errorMsg.includes("429") || errorMsg.includes("quota exceeded") || errorMsg.includes("rate limit")) {
           console.error("[POST /api/analyze-image] Rate limit exceeded for Gemini API.");
           return res.status(429).json({ error: "quota exceeded" });
       }
       
       res.status(500).json({ error: "Failed to analyze image: " + error.message });
    }
  });

  app.post("/api/predict-assignment", async (req, res) => {
    try {
      console.log("[POST /api/predict-assignment] Request received.");
      const { category, severity, description } = req.body;
      
      console.log(`[POST /api/predict-assignment] Incoming category: ${category}`);

      let department = "Municipal Services";
      switch(category) {
        case "Water Leak":
          department = "Water Department";
          break;
        case "Pothole":
        case "Road Damage":
          department = "Roads & Traffic";
          break;
        case "Garbage":
          department = "Health & Sanitation";
          break;
        case "Streetlight Damage":
        case "Infrastructure Damage":
          department = "Public Works";
          break;
        default:
          department = "Municipal Services";
      }

      console.log(`[POST /api/predict-assignment] Assigned department: ${department}`);

      let priority = "MEDIUM";
      if (severity === "CRITICAL") priority = "URGENT";
      else if (severity === "HIGH") priority = "HIGH";
      else if (severity === "MEDIUM") priority = "MEDIUM";
      else if (severity === "LOW") priority = "LOW";

      console.log(`[POST /api/predict-assignment] Priority: ${priority}`);

      let estimatedResolutionDays = 4;
      let recommendedAction = "Route issue for municipal review.";
      
      if (department === "Water Department") {
        estimatedResolutionDays = 2;
        recommendedAction = "Dispatch leak inspection team.";
      } else if (department === "Health & Sanitation") {
        estimatedResolutionDays = 3;
        recommendedAction = "Deploy sanitation response team.";
      } else if (department === "Roads & Traffic") {
        estimatedResolutionDays = 4;
        recommendedAction = "Schedule road inspection and repair.";
      } else if (department === "Public Works") {
        estimatedResolutionDays = 5;
        recommendedAction = "Assign maintenance crew for assessment.";
      } else if (department === "Municipal Services") {
        estimatedResolutionDays = 4;
        recommendedAction = "Route issue for municipal review.";
      }

      const responsePayload = {
        assignedDepartment: department,
        priority: priority,
        estimatedResolutionDays: estimatedResolutionDays,
        recommendedAction: recommendedAction
      };
      
      console.log(`[POST /api/predict-assignment] API response:`, responsePayload);
      res.json(responsePayload);

    } catch (error) {
      console.error("[POST /api/predict-assignment] Error:", error);
      res.status(500).json({ error: error.message || "Failed to predict assignment" });
    }
  });

  app.post("/api/generate-insights", async (req, res) => {
    try {
      console.log("[POST /api/generate-insights] Request received.");
      const { category, severity, location, stats } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `You are a data analyst AI for CivicEye generating predictive insights from issue data.
Analyze this new issue and historical metrics to generate 3 actionable insights with trend predictions.

Return ONLY valid JSON.
No explanations.
No markdown.
No code fences.

Expected JSON format:
{
  "insights": [
    {
      "type": "string (TREND/HOTSPOT/SECONDARY_RISK/EFFICIENCY/RESOURCE)",
      "title": "string (short title)",
      "description": "string (2-3 sentences)",
      "confidence": "string (HIGH/MEDIUM/LOW)",
      "actionableRecommendation": "string"
    }
  ],
  "riskAssessment": "string",
  "predictedFollowUpIssues": ["string", "string"]
}

Current Issue:
Category: ${category}
Severity: ${severity}
Location: ${location || "Unknown"}

Historical Stats:
${JSON.stringify(stats, null, 2)}`;

      console.log(`[POST /api/generate-insights] Prompt:`, prompt);
      console.log("Calling Gemini");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: prompt }],
        config: {
          maxOutputTokens: 2000,
          responseMimeType: "application/json"
        }
      });
      
      const text = response.text;
      console.log(`[POST /api/generate-insights] Gemini response:`, text);
      console.log("Gemini Raw Response:", text);

      if (!text) {
        throw new Error("No response text");
      }
      
      let rawText = text.trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.substring(7);
      } else if (rawText.startsWith("```")) {
        rawText = rawText.substring(3);
      }
      if (rawText.endsWith("```")) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
      
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         rawText = jsonMatch[0];
      }

      try {
        const result = JSON.parse(rawText.trim());
        console.log(`[POST /api/generate-insights] Parsed JSON successfully.`);
        res.json(result);
      } catch (parseError) {
        console.error("[POST /api/generate-insights] JSON Parse Error:", parseError, "Raw format:", rawText);
        throw new Error("JSON Parsing failed"); // Let the outer catch handle the fallback
      }
    } catch (error) {
      console.error("[POST /api/generate-insights] Gemini / Network / Request Error. Details:", error.message || error);
      
      const { category, stats } = req.body;
      const reportCount = stats?.categoryCount || 0;
      const prevCount = stats?.previousPeriodCount || 0;
      const hotspot = stats?.hotspotZone || "Unknown";
      const avgRes = stats?.averageResolutionDays || 0;

      const isIncreasing = reportCount > prevCount;
      const trendTitle = isIncreasing ? "Increasing Trend" : "Stable Trend";
      const trendDesc = isIncreasing 
        ? `Report volume for ${category} is increasing compared to the previous period.`
        : `Report volume for ${category} remains stable compared to the previous period.`;

      const highSevCount = stats?.highSeverityCount || 0;
      const severityRatio = reportCount > 0 ? ((highSevCount / reportCount) * 100).toFixed(0) : 0;

      const isHighSeverity = Number(severityRatio) > 50;
      let riskAssessment = "Moderate Community Impact";
      if (isHighSeverity) {
        riskAssessment = "High Priority Community Concern";
      } else if (isIncreasing) {
        riskAssessment = "Elevated Infrastructure Risk";
      } else if (avgRes > 5) {
        riskAssessment = "Active Monitoring Recommended";
      } else {
        riskAssessment = "Low Operational Risk";
      }

      const fallbackInsights = {
        riskAssessment: riskAssessment,
        insights: [
          {
            type: "TREND",
            title: isIncreasing ? "Increasing Incident Frequency" : "Stable Incident Frequency",
            description: isIncreasing ? "Reports in this category have risen during the recent reporting cycle, indicating a growing community concern." : "Reporting volume for this category remains stable, showing no unusual spikes in community activity.",
            confidence: "HIGH",
            actionableRecommendation: isIncreasing ? "Allocate additional resources to address the rising trend." : "Continue standard monitoring."
          },
          {
            type: "HOTSPOT",
            title: hotspot !== "Unknown" ? "Emerging Hotspot Detected" : "Distributed Reporting Pattern",
            description: hotspot !== "Unknown" ? `Multiple reports have been concentrated in ${hotspot}, suggesting localized infrastructure stress.` : "Incident locations are relatively distributed, with no severe geographic concentrations identified.",
            confidence: hotspot !== "Unknown" ? "HIGH" : "MEDIUM",
            actionableRecommendation: hotspot !== "Unknown" ? `Focus patrols and resources in ${hotspot}.` : "Maintain even resource distribution."
          },
          {
            type: "EFFICIENCY",
            title: "Preventive Action Recommended",
            description: "Early intervention and continued monitoring will reduce future incidents and improve overall service efficiency.",
            confidence: "MEDIUM",
            actionableRecommendation: "Implement proactive maintenance schedules."
          }
        ],
        predictedFollowUpIssues: []
      };

      console.log("[POST /api/generate-insights] Returning deterministic fallback insights due to AI error.");
      return res.json(fallbackInsights);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
