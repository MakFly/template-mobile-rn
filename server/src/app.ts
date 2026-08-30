import { ConversationService } from './application/conversations';
import { createHttpApp } from './interfaces/http';
import { OpenAIChatModel } from './infrastructure/openai-chat-model';
import {
  openDatabase,
  SQLiteMessageRepository,
  SQLiteThreadRepository,
} from './infrastructure/sqlite-repositories';

export interface AppConfig {
  databasePath: string;
  corsOrigins: string[];
  openaiApiKey?: string;
  openaiModel?: string;
  openaiTitleModel?: string;
}

export function createApp(config: AppConfig) {
  const database = openDatabase(config.databasePath);
  const service = new ConversationService(
    new SQLiteThreadRepository(database),
    new SQLiteMessageRepository(database),
    new OpenAIChatModel({
      apiKey: config.openaiApiKey,
      model: config.openaiModel,
      titleModel: config.openaiTitleModel,
    }),
  );
  return { app: createHttpApp(service, config.corsOrigins), database };
}
