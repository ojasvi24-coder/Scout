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
You continuously analyze Research (arXiv), Patents, Startup launches, Job postings, and Funding.
Your goal is to identify a highly valuable problem that is currently unsolved or underserved.
Focus area: ${topic ? topic : "emerging technologies, unexpected market shifts, or unsexy but highly profitable industries"}.

Generate a novel, high-quality startup opportunity in the following JSON format:
{
  "title": "Short, catchy descriptive title of the startup",
  "problem": "Detailed, compelling explanation of the problem and why it is rapidly becoming valuable right now",
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
  "competitionLevel": "Low" or "Medium",
  "competitors": [
    { "name": "Competitor 1", "description": "What they do", "moat": "Their advantage", "weaknesses": ["Weakness 1", "Weakness 2"] }
  ]
}

Ensure the opportunity is highly creative, genuinely useful, and sounds like a legitimate YC-backed startup idea. Use realistic-sounding evidence. Return ONLY valid JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const opportunity = JSON.parse(text);
      return NextResponse.json({ opportunity });
    } catch (apiError: any) {
      console.warn("API Error, falling back to mock:", apiError);
      // Fallback for demo when quota is exceeded
      const fallbackOpportunity = {
        title: "AI Quality Control for Specialized Manufacturing",
        problem: "Specialized manufacturing (e.g., medical devices, aerospace parts) requires intense precision, but human QA is slow and prone to fatigue. Current computer vision systems are too rigid for low-volume, high-mix production lines.",
        metrics: {
          trendGrowth: 92,
          demandGrowth: 89,
          marketScore: 85,
          competitionScore: 12
        },
        marketDetails: {
          tam: "$15B",
          sam: "$4.5B",
          som: "$400M",
          description: "Visual inspection and QA for high-margin manufacturing."
        },
        evidence: [
          "Defect rates in high-mix manufacturing lead to $2B+ in scrap annually.",
          "Surge in specialized hardware startup launches needing rapid iteration.",
          "Lack of agile visual AI tools adaptable to daily line changes."
        ],
        suggestedStartup: "An adaptable AI vision system that learns new defect patterns from a single CAD file and 5 reference images.",
        mvp: [
          "Few-shot training module for defect detection.",
          "Integration with standard factory arm cameras.",
          "Operator feedback loop tablet app."
        ],
        potentialCustomers: [
          "Medical device contract manufacturers",
          "Aerospace component makers",
          "Boutique automotive parts suppliers"
        ],
        competitionLevel: "Low",
        competitors: [
          {
            name: "Traditional Machine Vision",
            description: "Fixed rule-based camera systems.",
            moat: "Incumbency",
            weaknesses: ["Requires weeks of programming", "Cannot adapt to new parts quickly"]
          }
        ]
      };
      return NextResponse.json({ opportunity: fallbackOpportunity });
    }
  } catch (error: any) {
    console.error("Discovery error", error);
    return NextResponse.json({ error: error.message || "Failed to discover" }, { status: 500 });
  }
}
