import { ai, GEMINI_MODEL } from '@/lib/gemini';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

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
      Given the database table named "${tableName}" with the following column structure:
      ${schema}

      Generate an appropriate PostgreSQL SQL query to answer the user's question: "${question}"

      Rules:
      1. Generate ONLY a read-only SELECT statement. Do NOT generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or other write queries.
      2. Return ONLY valid SQL that matches the column names and data types of the schema.
      3. Do not include markdown formatting or backticks in the "sql" field; return it as a raw SQL string.
      4. Ensure all database table references are correctly enclosed in quotes or match "${tableName}" exactly.
    `;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT' as never,
            properties: {
              sql: { type: 'STRING' },
              explanation: { type: 'STRING' },
            },
            required: ['sql', 'explanation'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
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
   * Mode 2: General Data Question (No File Uploaded)
   * Uses Gemini knowledge to generate structured data, chart configuration, and insights.
   */
  async generateGeneralData(
    question: string
  ): Promise<{ data: unknown[]; chartConfig: unknown; insights: string }> {
    const prompt = `
      The user is asking a general data question: "${question}"
      Use your internal knowledge base to generate:
      1. A structured list of data rows (array of objects) suitable for charts.
      2. A chart configuration object for Recharts.
      3. A natural-language insight/summary of the data.

      Rules for chartConfig:
      - Must specify:
        - "type": the chart type ('bar' | 'line' | 'area' | 'pie')
        - "xKey": the property to use on the X-Axis
        - "yKeys": array of properties to plot on the Y-Axis
    `;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT' as never,
            properties: {
              data: {
                type: 'ARRAY',
                items: { type: 'OBJECT' },
              },
              chartConfig: {
                type: 'OBJECT',
                properties: {
                  type: { type: 'STRING' },
                  xKey: { type: 'STRING' },
                  yKeys: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                  },
                },
                required: ['type', 'xKey', 'yKeys'],
              },
              insights: { type: 'STRING' },
            },
            required: ['data', 'chartConfig', 'insights'],
          },
        },
      });

      const responseText = response.text || '{}';
      return JSON.parse(responseText);
    } catch (error) {
      console.error('[AI Service] Failed to generate general data response:', error);
      throw new Error('Failed to retrieve answer for your general question. Please try again.');
    }
  },

  /**
   * Post-Query Insight and Chart Generation
   * Generates natural language insights and Recharts configuration from query execution results.
   */
  async generateInsightsAndChart(
    question: string,
    queryResults: unknown[]
  ): Promise<{ insights: string; chartConfig: unknown }> {
    const prompt = `
      The user asked: "${question}"
      Here are the query results from their database:
      ${JSON.stringify(queryResults.slice(0, 100), null, 2)}

      Generate:
      1. Natural-language insights/summaries explaining the result data in relation to their question.
      2. A Recharts chart configuration object.

      Rules for chartConfig:
      - Must specify:
        - "type": the chart type ('bar' | 'line' | 'area' | 'pie')
        - "xKey": the property name for the X-Axis
        - "yKeys": array of property names to plot on the Y-Axis
    `;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT' as never,
            properties: {
              insights: { type: 'STRING' },
              chartConfig: {
                type: 'OBJECT',
                properties: {
                  type: { type: 'STRING' },
                  xKey: { type: 'STRING' },
                  yKeys: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                  },
                },
                required: ['type', 'xKey', 'yKeys'],
              },
            },
            required: ['insights', 'chartConfig'],
          },
        },
      });

      const responseText = response.text || '{}';
      return JSON.parse(responseText);
    } catch (error) {
      console.error('[AI Service] Failed to generate insights and chart config:', error);
      throw new Error('Failed to generate insights from the query results.');
    }
  },

  /**
   * Minor LangChain Usage Example.
   * Invokes Gemini model using LangChain's google-genai wrapper.
   */
  async askLangChain(prompt: string): Promise<string> {
    try {
      const model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
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
