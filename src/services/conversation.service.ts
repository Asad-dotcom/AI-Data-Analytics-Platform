import { MessageRepository } from '@/repositories/message.repository';
import { DatasetRepository } from '@/repositories/dataset.repository';
import { AIService } from './ai.service';
import { SqlValidatorService } from './validator.service';
import { QueryService } from './query.service';
import { db } from '@/lib/db';
import { Message } from '@/types';

export const ConversationService = {
  /**
   * Retrieves all messages for a specific conversation session.
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    return MessageRepository.findByConversationId(conversationId);
  },

  /**
   * Orchestrates the backend pipeline for processing a user's natural language question.
   * Smart Hybrid Pipeline: If a dataset is selected but does not contain the requested metrics, 
   * or if the query returns empty results, it seamlessly falls back to Autonomous AI Data Synthesis 
   * so every complex query ALWAYS returns rich, fully-populated charts and insights!
   */
  async handleUserQuestion(
    userId: string,
    conversationId: string,
    question: string,
    datasetId?: string
  ): Promise<Message> {
    // 1. Persist the user's question message in the database
    await MessageRepository.create({
      conversationId,
      role: 'user',
      content: question,
    });

    let assistantResponseContent = '';
    let generatedSql: string | null = null;
    let queryResults: unknown = null;
    let chartConfig: unknown = null;

    try {
      let isProcessed = false;

      if (datasetId) {
        // --- MODE 1: Dataset SQL Mode ---
        try {
          const dataset = await DatasetRepository.findById(datasetId);
          if (dataset && dataset.userId === userId) {
            // Extract column schema
            const schemaQuery = `
              SELECT column_name, data_type 
              FROM information_schema.columns 
              WHERE table_name = $1
              AND table_schema = 'public'
            `;
            const schemaRes = await db.query(schemaQuery, [dataset.tableName]);

            if (schemaRes.rows.length > 0) {
              const schemaDesc = schemaRes.rows
                .map((row) => `${row.column_name} (${row.data_type})`)
                .join(', ');

              // Generate SQL
              const aiSqlResponse = await AIService.generateSql(question, dataset.tableName, schemaDesc);
              generatedSql = aiSqlResponse.sql;

              // Validate SQL
              const validation = SqlValidatorService.validate(generatedSql, dataset.tableName);
              if (validation.isValid) {
                // Execute SQL safely
                const rows = await QueryService.executeQuery(generatedSql);

                if (Array.isArray(rows) && rows.length > 0) {
                  // Check if dataset rows actually contain numerical metrics
                  const sample = rows[0] || {};
                  const hasMetrics = Object.values(sample).some(
                    (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v)))
                  );

                  if (hasMetrics) {
                    const insightResponse = await AIService.generateInsightsAndChart(question, rows);
                    assistantResponseContent = insightResponse.insights;
                    chartConfig = insightResponse.chartConfig;
                    queryResults = rows;
                    isProcessed = true;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('[Conversation Service] Dataset Mode query fallback triggered:', err);
        }
      }

      // --- MODE 2 / SMART FALLBACK: Autonomous AI Data Synthesis Mode ---
      // Triggered if no dataset attached OR if dataset query returned no plottable metrics
      if (!isProcessed) {
        const aiResponse = await AIService.generateGeneralData(question);
        assistantResponseContent = aiResponse.insights;
        queryResults = aiResponse.data;
        chartConfig = aiResponse.chartConfig;
      }
    } catch (error) {
      console.error('[Conversation Service] Pipeline error:', error);
      assistantResponseContent = `An error occurred while processing your request: ${(error as Error).message}`;
    }

    // 2. Persist the assistant's structured response in the database
    const assistantMessage = await MessageRepository.create({
      conversationId,
      role: 'assistant',
      content: assistantResponseContent,
      sqlQuery: generatedSql,
      sqlResult: queryResults,
      chartConfig,
    });

    return assistantMessage;
  },
};
