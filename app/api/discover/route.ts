import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    const ai = new GoogleGenAI({ apiKey });
    const { topic } = await req.json();

    const prompt = `You are an autonomous Opportunity Discovery AI. 
You continuously analyze real-world data including Research, Patents, Startup launches, Job postings, and Funding using Google Search.
Your goal is to identify a highly valuable problem that is currently unsolved or underserved.
Focus area: ${topic ? topic : "Specialized Manufacturing (e.g. low-volume high-mix), Spatial Computing Regulatory Compliance (e.g. AR/VR biometric data anonymization), Climate Tech & Smart Infrastructure (e.g. targeted server rack micro-cooling, local farm satellite water-scarcity tracking), or Niche B2B SaaS (e.g. passkey migration, AI license scanners)"}.

Search the web for the latest emerging trends, new regulations, recent scientific papers, and shifting job roles related to the focus area to find a real, tangible market gap.
Based on your real-world findings, generate a novel, high-quality startup opportunity in the following JSON format:
{
  "title": "Short, catchy descriptive title of the startup",
  "problem": "Detailed, compelling explanation of the problem based on REAL data and why it is rapidly becoming valuable right now",
  "metrics": {
    "trendGrowth": number between 80-100,
    "demandGrowth": number between 80-100,
    "marketScore": number between 80-100,
    "competitionScore": number between 0-30
  },
  "marketDetails": {
    "tam": "Estimated TAM (e.g. $10B)",
    "sam": "Estimated SAM",
    "som": "Estimated SOM",
    "description": "Brief market context"
  },
  "evidence": ["Concrete point 1 (e.g., job posting surge)", "Concrete point 2 (e.g., recent technology breakthrough)", "Concrete point 3 (e.g., new regulation changing the landscape)"],
  "suggestedStartup": "One sentence description of the product or service to build",
  "mvp": ["Feature 1", "Feature 2", "Feature 3"],
  "potentialCustomers": ["Specific customer segment 1", "Specific customer segment 2", "Specific customer segment 3"],
  "competitionLevel": "Low",
  "competitors": [
    { "name": "Competitor 1", "description": "What they do", "moat": "Their advantage", "weaknesses": ["Weakness 1", "Weakness 2"] }
  ]
}

Ensure the opportunity is highly creative, genuinely useful, and sounds like a legitimate YC-backed startup idea. Return ONLY valid JSON without markdown wrapping.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const opportunity = JSON.parse(text);
      return NextResponse.json({ opportunity });
    } catch (apiError: any) {
      console.warn("API Error, falling back to mock:", apiError);
      
      // Fallback for demo when quota is exceeded
      const { INITIAL_OPPORTUNITIES } = require('@/lib/data');
      const fallbacks = INITIAL_OPPORTUNITIES.filter((opt: any) => 
        opt.title.includes('Manufacturing') || 
        opt.title.includes('Compliance') || 
        opt.title.includes('Cooling') || 
        opt.title.includes('Passkey') ||
        opt.title.includes('Tracker') ||
        opt.title.includes('Scanner')
      );
      
      const fallbackOpportunity = fallbacks.length > 0 
        ? fallbacks[Math.floor(Math.random() * fallbacks.length)] 
        : INITIAL_OPPORTUNITIES[0];
        
      return NextResponse.json({ opportunity: fallbackOpportunity });
    }
  } catch (error: any) {
    console.error("Discovery error", error);
    return NextResponse.json({ error: error.message || "Failed to discover" }, { status: 500 });
  }
}
