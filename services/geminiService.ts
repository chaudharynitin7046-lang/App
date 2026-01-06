
import { GoogleGenAI, Type } from "@google/genai";
import { Customer, Transaction, BusinessStats } from "../types";

export const getBusinessInsights = async (
  customers: Customer[],
  transactions: Transaction[],
  stats: BusinessStats
): Promise<{ summary: string; actionItems: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    As a business consultant, analyze this ledger data for an Indian business:
    Total Customers: ${customers.length}
    Total Sales: ₹${stats.totalSales}
    Total Due: ₹${stats.totalDue}
    Daily Sales: ₹${stats.dailySales}
    Monthly Sales: ₹${stats.monthlySales}
    
    Top Debtors: ${customers
      .filter(c => c.due > 0)
      .sort((a, b) => b.due - a.due)
      .slice(0, 3)
      .map(c => `${c.name}: ₹${c.due}`)
      .join(', ')}

    Provide a brief executive summary (max 2 sentences) and 3 specific action items for the business owner.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "actionItems"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"summary": "Unable to generate insights at this time.", "actionItems": []}');
    return result;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return {
      summary: "Business is operating normally. Keep tracking your dues regularly.",
      actionItems: ["Review pending payments", "Follow up with top debtors", "Maintain accurate records"]
    };
  }
};
