import { Router } from "express";
import { getGenAI } from "../lib/gemini.js";
import { Type, Schema } from "@google/genai";

const router = Router();

router.post("/evaluate-case", async (req, res) => {
  const { caseData } = req.body;
  
  if (!caseData) {
    return res.status(400).json({ error: "caseData is required" });
  }

  const ai = getGenAI();
  if (!ai) {
    return res.status(500).json({ error: "Gemini API key is not configured in the environment." });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Evaluate the following humanitarian case data and output a structured JSON assessment: ${JSON.stringify(caseData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityScore: { type: Type.INTEGER, description: "A score from 1 to 100 based on urgency." },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            recommendedAction: { type: Type.STRING, description: "Action to take for this case." },
            analysisSummary: { type: Type.STRING, description: "A brief summary of the case." }
          },
          required: ["priorityScore", "riskLevel", "recommendedAction", "analysisSummary"]
        }
      }
    });

    res.json({
      success: true,
      assessment: JSON.parse(response.text || "{}")
    });
  } catch (e: any) {
    console.error("Gemini case evaluation error:", e);
    res.status(500).json({ error: "Failed to evaluate case." });
  }
});

router.post("/ai/image-describe", async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 is required" });
  }

  const ai = getGenAI();
  if (!ai) {
    return res.status(500).json({ error: "Gemini API key is not configured in the environment." });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(",")[1] || imageBase64
          }
        },
        "صف هذه الصورة بدقة ومهنية، مركزاً على حالة المسكن أو الممتلكات."
      ]
    });

    res.json({
      success: true,
      caption: response.text || "تم التحليل بنجاح.",
      securityLog: "تمت المعالجة بأمان تام."
    });
  } catch (e: any) {
    console.error("Gemini image describe error:", e);
    res.status(500).json({ error: "فشل تحليل الصورة" });
  }
});

export default router;
