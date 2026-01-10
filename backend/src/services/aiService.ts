import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

// Initialize client with key from env
const ai = new GoogleGenAI({});

// Step 1: Filter
// Check if the email is related to a job application.

export async function isJobRelated(subject: string, sender: string): Promise<boolean> {
  try {
    const prompt = `
      Analyze this email.
      Subject: "${subject}"
      Sender: "${sender}"
      
      Is this email related to a job application, interview, rejection, or offer? 
      Reply ONLY with "true" or "false".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text?.toLowerCase().trim();
    return text === 'true';
  } catch (error) {
    console.error("AI Filter Error:", error);
    return false; // Fail safe
  }
}

// Step 2: Extraction
// Parse the body into JSON.
export async function extractJobData(bodyText: string) {
  try {
    // Truncate very long emails to save context/cost
    const truncatedBody = bodyText.substring(0, 5000);

    const prompt = `
      Extract job application details from this email text into a JSON object.
      
      Email Body:
      """
      ${truncatedBody}
      """
      
      Return a JSON object with these keys:
      - companyName (string, use "Unknown" if missing)
      - jobTitle (string, use "Unknown" if missing)
      - status (Enum: "Applied", "Interviewing", "Rejection", "Offer")
      - nextSteps (string, brief summary of action items or "None")

      Return ONLY the raw JSON string. No markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json" // Gemini 2.5 JSON mode
      }
    });

    const jsonString = response.text || "{}";
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return null;
  }
}
