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
   * Handles both Mode 1 (User Dataset) and Mode 2 (General Data Question).
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
      if (datasetId) {
        // --- MODE 1: User Dataset Mode ---
        
        // Fetch the dataset metadata
        const dataset = await DatasetRepository.findById(datasetId);
        if (!dataset) {
          throw new Error('The specified dataset was not found.');
        }

        // Verify ownership for security
        if (dataset.userId !== userId) {
          throw new Error('Unauthorized access: You do not own this dataset.');
        }

        // Dynamically extract column schema from Postgres catalog tables
        const schemaQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
          AND table_schema = 'public'
        `;
        const schemaRes = await db.query(schemaQuery, [dataset.tableName]);
        
        if (schemaRes.rows.length === 0) {
          throw new Error(`The dataset table "${dataset.tableName}" does not contain columns or does not exist.`);
        }

        const schemaDesc = schemaRes.rows
          .map((row) => `${row.column_name} (${row.data_type})`)
          .join(', ');

        // Call Gemini to generate a read-only SQL query
        const aiSqlResponse = await AIService.generateSql(question, dataset.tableName, schemaDesc);
        generatedSql = aiSqlResponse.sql;

        // Run security checks through the custom SQL Validator
        const validation = SqlValidatorService.validate(generatedSql, dataset.tableName);
        if (!validation.isValid) {
          throw new Error(validation.error || 'The generated SQL failed security validation checks.');
        }

        // Execute the query safely
        queryResults = await QueryService.executeQuery(generatedSql);

        // Send query results back to Gemini to synthesize natural insights and chart config
        const insightResponse = await AIService.generateInsightsAndChart(
          question,
          Array.isArray(queryResults) ? queryResults : []
        );
        assistantResponseContent = insightResponse.insights;
        chartConfig = insightResponse.chartConfig;

      } else {
        // --- MODE 2: General Data Question Mode ---
        
        // Use Gemini knowledge to generate structured data, chart layout, and summary insights
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
