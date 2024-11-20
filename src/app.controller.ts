import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';

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
    return {
      message: 'FXQL Statement Parsed Successfully.',
      data,
      code: 'FXQL-200',
    };
  }
}
