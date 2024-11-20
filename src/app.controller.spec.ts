import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('parseStatements', () => {
    it('should return correct entries', () => {
      const appController = app.get(AppController);
      const code = 'USD-GBP {\\n BUY 100\\n SELL 200\\n CAP 93800\\n}';
      expect(appController.parseFxqlStatements({ FXQL: code })).toEqual({
        message: 'FXQL Statement Parsed Successfully.',
        data: [
          {
            EntryId: 1,
            SourceCurrency: 'USD',
            DestinationCurrency: 'GBP',
            BuyPrice: 100,
            SellPrice: 200,
            CapAmount: 93800,
          },
        ],
        code: 'FXQL-200',
      });
    });

    it('should parse multiple statements', () => {
      const appController = app.get(AppController);
      const code =
        'USD-GBP {\\n  BUY 0.85\\n  SELL 0.90\\n  CAP 10000\\n}\\n\\nEUR-JPY {\\n  BUY 145.20\\n  SELL 146.50\\n  CAP 50000\\n}\\n\\nNGN-USD {\\n  BUY 0.0022\\n  SELL 0.0023\\n  CAP 2000000\\n}';
      expect(appController.parseFxqlStatements({ FXQL: code })).toEqual({
        message: 'FXQL Statement Parsed Successfully.',
        data: [
          {
            EntryId: 1,
            SourceCurrency: 'USD',
            DestinationCurrency: 'GBP',
            BuyPrice: 0.85,
            SellPrice: 0.9,
            CapAmount: 10000,
          },
          {
            EntryId: 2,
            SourceCurrency: 'EUR',
            DestinationCurrency: 'JPY',
            BuyPrice: 145.2,
            SellPrice: 146.5,
            CapAmount: 50000,
          },
          {
            EntryId: 3,
            SourceCurrency: 'NGN',
            DestinationCurrency: 'USD',
            BuyPrice: 0.0022,
            SellPrice: 0.0023,
            CapAmount: 2000000,
          },
        ],
        code: 'FXQL-200',
      });
    });

    it('should return error if currency pair is invalid', () => {
      const appController = app.get(AppController);
      const code = 'usd-GBP {\n BUY 100\n SELL 200\n CAP 93800\n}';
      let hasError = false;
      let data = null;
      try {
        appController.parseFxqlStatements({ FXQL: code });
      } catch (error) {
        data = error.response.data;
        hasError = true;
      }
      expect(hasError).toBe(true);
      expect(data).toEqual({
        message: `Invalid currency pair 'usd-GBP'`,
        line: 1,
        column: 7,
      });
    });

    it('should return error if statement are not separated by new line', () => {
      const appController = app.get(AppController);
      const code =
        'USD-GBP { BUY 100 SELL 200 CAP 93800 } USD-GBP { BUY 100 SELL 200 CAP 93800 }';
      let hasError = false;
      let data = null;
      try {
        appController.parseFxqlStatements({ FXQL: code });
      } catch (error) {
        data = error.response.data;
        hasError = true;
      }
      expect(hasError).toBe(true);
      expect(data).toEqual({
        message: 'FXQL statements must be separated by a single newline',
        line: 1,
        column: 46,
      });
    });

    it('should return error if keyword params are invalid', () => {
      const appController = app.get(AppController);
      const code = 'USD-GBP { BUY 100 SELL 200 CAP -50 }';
      let hasError = false;
      let data = null;
      try {
        appController.parseFxqlStatements({ FXQL: code });
      } catch (error) {
        data = error.response.data;
        hasError = true;
      }
      expect(hasError).toBe(true);
      expect(data).toEqual({
        message: `CAP value must be a positive whole number, but got '-50'`,
        line: 1,
        column: 34,
      });
    });
  });
});
