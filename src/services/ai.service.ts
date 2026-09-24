import { ai, GEMINI_MODEL } from '@/lib/gemini';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const SUPPORTED_MODELS = [
  'gemini-3.6-flash',
  GEMINI_MODEL,
  'gemini-3.6-pro',
];

/**
 * Resilient Gemini API invoker with automatic retry on 503 high-demand / 429 quota spikes
 */
async function executeGeminiRequest(prompt: string): Promise<string> {
  let lastError: any = null;

  for (const modelName of Array.from(new Set(SUPPORTED_MODELS.filter(Boolean)))) {
    // Attempt up to 3 retries per model if Google returns 503 high-demand
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (error: any) {
        lastError = error;
        const status = error?.status || error?.code;
        const message = error?.message || '';

        console.warn(
          `[AI Service] Attempt ${attempt}/3 on model ${modelName} encountered (${status}: ${message})`
        );

        // If Google server is experiencing temporary high demand (503), wait and retry
        if (status === 503 || message.includes('503') || message.includes('high demand') || message.includes('UNAVAILABLE')) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
          continue;
        }

        // If rate limited (429), wait and retry
        if (status === 429 || message.includes('429')) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        // If 404 (model deprecated for project), break inner loop to try next model in SUPPORTED_MODELS
        if (status === 404 || message.includes('404') || message.includes('NOT_FOUND')) {
          break;
        }
      }
    }
  }

  throw lastError || new Error('Failed to generate response from AI models.');
}

export const AIService = {
  /**
   * Mode 1: Dataset Mode
   * Generates a PostgreSQL SQL SELECT statement based on user question and table schema.
   */
  async generateSql(
    question: string,
    tableName: string,
    schema: string
  ): Promise<{ sql: string; explanation: string }> {
    const prompt = `
      You are an expert SQL generator for PostgreSQL.
      Given the database table named "${tableName}" with the column structure:
      ${schema}

      Generate an appropriate PostgreSQL SQL query to answer the user's question: "${question}"

      CRITICAL RULES:
      1. Generate ONLY a read-only SELECT statement. Do NOT generate write queries.
      2. If casting any TEXT column to NUMERIC/DECIMAL for aggregations like AVG() or SUM(), ALWAYS strip commas and currency symbols first using: CAST(REPLACE(REPLACE(REPLACE("${tableName}"."col_name"::text, ',', ''), '$', ''), ' ', '') AS NUMERIC)!
      3. If the user asks for a specific metric that is not literally in column names, pick the closest numerical column or perform COUNT / GROUP BY aggregation.
      4. Return a JSON object with fields "sql" and "explanation".
    `;

    try {
      const responseText = await executeGeminiRequest(prompt);
      const parsed = JSON.parse(responseText || '{}');
      return {
        sql: parsed.sql || '',
        explanation: parsed.explanation || '',
      };
    } catch (error) {
      console.error('[AI Service] Failed to generate SQL query:', error);
      throw new Error('Failed to interpret your question into a database query. Please try phrasing it differently.');
    }
  },

  /**
   * Mode 2: General Data Question (No File Uploaded or Complex Autonomous Synthesis)
   * Uses Gemini knowledge base to answer complex questions (e.g. RFM segmentation, forecasting, dips)
   * with complete datasets, charts, and crisp bullet points.
   */
  async generateGeneralData(
    question: string
  ): Promise<{ data: unknown[]; chartConfig: unknown; insights: string }> {
    const prompt = `
      You are an expert lead data analyst and executive business consultant.
      The user is asking a complex data analytics question: "${question}"

      CRITICAL MANDATE:
      1. Answer the user's question directly with realistic, accurate, and high-value data analytics.
      2. For complex analytics questions (e.g. Average Order Value, RFM customer segmentation, top 20% revenue share, 2026 3-month forecasting, monthly dips), generate realistic 6-12 item data arrays with numerical and categorical values.
      3. Return ONLY a JSON object with 3 fields: "insights", "chartConfig", and "data".

      FORMAT FOR "insights":
      - Short, crisp, 3-4 bullet points maximum.
      - Structure using clean Markdown:
         ### Key Highlights
         - **Direct Answer:** [Direct answer to user query with exact numbers]
         - **Key Trend:** [Main observation or breakdown]
         - **Strategic Action:** [Actionable business recommendation]

      FORMAT FOR "chartConfig":
      - "title": Professional title for the chart.
      - "description": Short caption describing what the chart represents.
      - "type": Best visual chart type ('bar' | 'line' | 'area' | 'pie').
      - "xKey": Category property name in data objects for X-Axis.
      - "yKeys": Array of numerical metric property names in data objects for Y-Axis.
      - "colors": Array of modern hex color strings (e.g., ["#6366f1", "#10b981", "#ec4899", "#f59e0b", "#0ea5e9"]).

      FORMAT FOR "data":
      - Array of 6-12 objects containing clean categorical properties and numerical metrics for Recharts visualization.
    `;

    try {
      const responseText = await executeGeminiRequest(prompt);
      const parsed = JSON.parse(responseText || '{}');

      return {
        data: Array.isArray(parsed.data) ? parsed.data : [],
        chartConfig: parsed.chartConfig || {
          title: 'Analytics Summary',
          type: 'bar',
          xKey: 'Category',
          yKeys: ['Value'],
        },
        insights: parsed.insights || 'Analysis generated successfully.',
      };
    } catch (error: any) {
      console.error('[AI Service] Failed to generate general data response:', error);
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded')) {
        throw new Error('API Rate limit reached for Gemini free tier. Please wait ~30 seconds and try again.');
      }
      throw new Error('Failed to retrieve answer for your question. Please try again.');
    }
  },

  /**
   * Post-Query Insight and Chart Generation
   * Synthesizes natural language text insights along with Recharts configuration based on query results.
   */
  async generateInsightsAndChart(
    question: string,
    queryResults: unknown[]
  ): Promise<{ insights: string; chartConfig: unknown }> {
    const prompt = `
      You are an expert lead data analyst.
      The user asked: "${question}"

      Here are the actual SQL query execution results from their dataset (up to 100 rows):
      ${JSON.stringify(queryResults.slice(0, 100), null, 2)}

      Return ONLY a JSON object with fields "insights" and "chartConfig".

      FORMAT FOR "insights":
      - Short, crisp, 3-4 bullet points maximum.
      - Structure using clean Markdown:
         ### Key Highlights
         - **Key Finding:** [Finding based on data]
         - **Trend:** [Observation]
         - **Recommendation:** [Next step]

      FORMAT FOR "chartConfig":
      - "title": Professional title for the chart.
      - "description": Short caption explaining the visual data.
      - "type": Best chart visualization type ('bar' | 'line' | 'area' | 'pie').
      - "xKey": Main categorical column name for X-Axis.
      - "yKeys": Array of numerical metric column names for Y-Axis.
      - "colors": Array of modern hex color strings (e.g., ["#6366f1", "#10b981", "#ec4899", "#f59e0b", "#0ea5e9"]).
    `;

    try {
      const responseText = await executeGeminiRequest(prompt);
      const parsed = JSON.parse(responseText || '{}');

      return {
        insights: parsed.insights || 'Query analysis complete.',
        chartConfig: parsed.chartConfig || {
          title: 'Query Visual Output',
          type: 'bar',
          xKey: 'Category',
          yKeys: ['Value'],
        },
      };
    } catch (error: any) {
      console.error('[AI Service] Failed to generate insights and chart config:', error);
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded')) {
        throw new Error('API Rate limit reached for Gemini free tier. Please wait ~30 seconds and try again.');
      }
      throw new Error('Failed to generate insights from the query results.');
    }
  },

  /**
   * Minor LangChain Usage Example.
   */
  async askLangChain(prompt: string): Promise<string> {
    try {
      const model = new ChatGoogleGenerativeAI({
        model: GEMINI_MODEL,
        apiKey: process.env.GEMINI_API_KEY,
      });
      const response = await model.invoke(prompt);
      return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    } catch (error) {
      console.error('[AI Service] LangChain invocation error:', error);
      throw error;
    }
  },
};
