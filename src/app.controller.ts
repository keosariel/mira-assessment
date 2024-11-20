import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';

const MAX_STATEMENTS = 1000;

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('fxql-statements')
  parseFxqlStatements(@Body() body: { FXQL: string }): any {
    if (!body.FXQL) {
      throw new BadRequestException({
        message: 'FXQL is required',
        code: 'FXQL-400',
      });
    }
    const [data, error] = this.appService.parseStatements(body.FXQL);
    if (error) {
      throw new BadRequestException({
        message: 'FXQL Parsing Error',
        data,
        code: 'FXQL-400',
      });
    }

    if (Array.isArray(data) && data.length >= MAX_STATEMENTS) {
      throw new BadRequestException({
        message: `Too many statements, maximum is ${MAX_STATEMENTS}`,
        code: 'FXQL-400',
      });
    }

    return {
      message: 'FXQL Statement Parsed Successfully.',
      data,
      code: 'FXQL-200',
    };
  }
}
