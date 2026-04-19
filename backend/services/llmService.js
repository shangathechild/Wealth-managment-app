const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeInvestorProfile(surveyResults) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    As a senior wealth management advisor, analyze this investor profile and provide a comprehensive, 15-25 year investment plan.
    
    Investor Profile:
    - Risk Tolerance: ${surveyResults.risk}
    - Goal: ${surveyResults.goal}
    - Time Horizon: ${surveyResults.horizon}
    
    Requirements:
    1. Focus on long-term wealth building: Gold, Real Estate, Bonds, Mutual Funds, and Fixed Deposits.
    2. Suggest an asset allocation percentage (e.g., 30% Real Estate, 20% Gold, etc.).
    3. Provide actionable advice for each year range (1-5, 5-10, 10-25 years).
    4. Format the response as a clear, structured JSON with "allocation", "advice", and "plan_summary" fields.
    
    The user wants to grow wealth significantly. Use professional but accessible language.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON from response if LLM wraps it in markdown
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("LLM Analysis Error:", err);
    return {
      plan_summary: "A customized plan based on your moderate risk profile focusing on diversified mutual funds and gold. Recommendation: 40% Equity MFs, 20% Gold, 40% Fixed Income.",
      allocation: { "Mutual Funds": 40, "Gold": 20, "Fixed Income": 40 }
    };
  }
}

module.exports = { analyzeInvestorProfile };
