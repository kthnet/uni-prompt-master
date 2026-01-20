import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedResult, RoleType, TaskType } from '../types';

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the expected JSON response schema
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    prompt: {
      type: Type.STRING,
      description: "The optimized prompt text generated for the user.",
    },
    analysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tag: { type: Type.STRING, description: "Name of the technique used (e.g., Persona, CoT)" },
          content: { type: Type.STRING, description: "Explanation of why this technique was used" },
          source: { 
            type: Type.STRING, 
            enum: ['Google', 'OpenAI', 'Anthropic', 'Common'],
            description: "The source guide where this technique comes from"
          },
          color: { 
            type: Type.STRING, 
            enum: ['indigo', 'purple', 'green', 'blue'],
            description: "Color coding for the UI" 
          },
        },
        required: ['tag', 'content', 'source', 'color'],
      },
      description: "A list of educational analysis points explaining the prompt engineering techniques.",
    },
    tip: {
      type: Type.STRING,
      description: "A practical tip for the user to improve their input next time.",
    },
  },
  required: ['prompt', 'analysis', 'tip'],
};

/**
 * Generates an optimized prompt and educational analysis using Gemini.
 */
export const generateOptimizedPrompt = async (
  role: RoleType,
  task: TaskType,
  userContext: string
): Promise<GeneratedResult> => {
  try {
    const model = 'gemini-3-flash-preview'; // Using the latest fast model

    // System instruction to act as a Tutor
    const systemInstruction = `
You are the 'Uni-Prompt Master', an expert Prompt Engineering Instructor for university faculty and staff.
Your goal is not just to write a prompt, but to TEACH the user why it works based on official guides from Google, OpenAI, and Anthropic.

1.  **Analyze the User's Request:**
    -   **User Role:** ${role}
    -   **Task Type:** ${task}
    -   **Context:** ${userContext}

2.  **Create the Optimized Prompt:**
    -   Use a professional structure: [Context] -> [Task] -> [Constraints] -> [Output Format].
    -   Apply specific techniques:
        -   **Persona:** Assign a specific role (e.g., "Senior Grant Consultant", "20-year Admin Expert"). (Source: OpenAI/Anthropic)
        -   **Delimiters:** Use XML tags (e.g., <input_data>, <constraints>) to separate instruction from data. (Source: Anthropic/Google)
        -   **Chain of Thought:** For complex logic, ask the model to "Think step-by-step". (Source: Google)
        -   **Few-Shot:** If helpful, include an example (Input -> Output).

3.  **Generate Analysis & Tips:**
    -   Explain 3-4 key techniques used in your generated prompt.
    -   Provide one actionable 'Official Tip' to help the user improve their *original input* (e.g., "Next time, try adding specific numbers for better results").

4.  **Language:**
    -   The 'prompt' should be in Korean (but can use English structural headers like [Task]).
    -   The 'analysis' and 'tip' MUST be in Korean.
`;

    const response = await ai.models.generateContent({
      model: model,
      contents: `Please generate the optimized prompt and educational content for the following context:\n${userContext}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // Balance between creativity and structure
      },
    });

    const responseText = response.text;
    
    if (!responseText) {
      throw new Error("No response generated from Gemini.");
    }

    // Parse JSON
    const result = JSON.parse(responseText) as GeneratedResult;
    return result;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    
    // Fallback error object to prevent app crash
    return {
      prompt: "⚠️ AI 서비스 연결에 실패했습니다.\n\n1. API Key가 설정되었는지 확인해주세요.\n2. 잠시 후 다시 시도해주세요.\n3. 문제가 지속되면 관리자에게 문의하세요.",
      analysis: [
        { 
          tag: 'Error', 
          content: '서버와 통신 중 문제가 발생했습니다. API Key 설정을 확인하세요.', 
          source: 'Common', 
          color: 'purple' 
        }
      ],
      tip: "API Key는 Vercel 배포 설정의 Environment Variables에서 'API_KEY'로 설정해야 합니다."
    };
  }
};