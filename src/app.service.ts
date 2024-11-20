import { Injectable } from '@nestjs/common';
import { FXQLParser, FXQLParserError } from './parser';
import { Entry } from './parser';

export type ParsedError = {
  message: string;
  line: number;
  column: number;
};

export type ParsedData = Entry[] | ParsedError;
export type ParsedResponse = [ParsedData, boolean];
@Injectable()
export class AppService {
  parseStatements(fxql: string): ParsedResponse {
    fxql = fxql.replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    const parser = new FXQLParser(fxql);
    try {
      parser.parse();
    } catch (error) {
      if (error instanceof FXQLParserError) {
        return [
          {
            message: error.message,
            line: error.line,
            column: error.column,
          },
          true,
        ];
      }
      throw error;
    }
    return [parser.getEntries(), false];
  }
}
