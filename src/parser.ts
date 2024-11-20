// types
export type Entry = {
  EntryId: number;
  SourceCurrency: string;
  DestinationCurrency: string;
  BuyPrice?: number;
  SellPrice?: number;
  CapAmount?: number;
};

type Structure = [string, string, string?];

// valid patterns
const CURRENCY_PAIR_PATTERN = /^[A-Z]{3}-[A-Z]{3}$/;
const THREE_LETTER_WORD = /^[A-Z]{3}$/;
const NUMBER_PATTERN = /^(0|[1-9]\d*)(\.\d+)?$/; // Covers for 0, integers, and decimals
const WHOLE_NUMBER_PATTERN = /^(0|[1-9]\d*)$/; // Covers for 0, integers

export class FXQLParserError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
  ) {
    super(message);
    this.name = 'FXQLParserError';
  }
}

export class FXQLParser {
  private input: string;
  private currentToken: string;
  private currentFunction: string;
  private expectedToken: string;
  private currentStructure: Structure[];
  private parsedEntries: Entry[];
  private line: number;
  private column: number;
  private lastLineWasEmpty: boolean;

  constructor(fxql: string) {
    this.input = fxql;
    this.currentToken = '';
    this.currentFunction = '';
    this.expectedToken = 'CURRENCY_PAIR';
    this.currentStructure = [];
    this.parsedEntries = [];
    this.line = 1;
    this.column = 0;
    this.lastLineWasEmpty = false;
  }

  private resetStructure() {
    this.currentStructure = [];
    this.lastLineWasEmpty = false;
  }

  private validateToken() {
    const token = this.currentToken.trim();

    if (!token) return;

    try {
      switch (this.expectedToken) {
        case 'CURRENCY_PAIR':
          if (!CURRENCY_PAIR_PATTERN.test(token)) {
            throw new FXQLParserError(
              `Invalid currency pair '${token}'`,
              this.line,
              this.column,
            );
          }
          this.currentStructure.push([
            'CURRENCY_PAIR',
            ...(token.split('-') as [string, string]),
          ]);
          this.expectedToken = 'SPACE';
          break;

        case 'SPACE':
          if (token !== '{') {
            throw new FXQLParserError(
              `Expected a single space and '{' after currency pair`,
              this.line,
              this.column,
            );
          }
          this.expectedToken = 'FUNC_NAME';
          break;

        case 'FUNC_NAME':
          if (['BUY', 'SELL', 'CAP'].includes(token)) {
            this.currentFunction = token;
            this.expectedToken = token === 'CAP' ? 'WHOLE_NUMBER' : 'NUMBER';
          } else if (token === '}') {
            if (
              !this.currentStructure.some(([type]) => type === 'FUNCTION_CALL')
            ) {
              throw new FXQLParserError(
                `Empty FXQL block detected`,
                this.line,
                this.column,
              );
            }
            this.finalizeEntry();
            this.expectedToken = 'NEWLINE_OR_END';
          } else {
            throw new FXQLParserError(
              `Unexpected function name '${token}'`,
              this.line,
              this.column,
            );
          }
          break;

        case 'NUMBER':
          if (!NUMBER_PATTERN.test(token)) {
            throw new FXQLParserError(
              `Invalid numeric value '${token}' for '${this.currentFunction}'`,
              this.line,
              this.column,
            );
          }
          this.currentStructure.push([
            'FUNCTION_CALL',
            this.currentFunction,
            token,
          ]);
          this.expectedToken = 'FUNC_NAME';
          break;

        case 'WHOLE_NUMBER':
          if (!WHOLE_NUMBER_PATTERN.test(token) || Number(token) < 0) {
            throw new FXQLParserError(
              `CAP value must be a positive whole number, but got '${token}'`,
              this.line,
              this.column,
            );
          }
          this.currentStructure.push([
            'FUNCTION_CALL',
            this.currentFunction,
            token,
          ]);
          this.expectedToken = 'FUNC_NAME';
          break;

        case 'NEWLINE_OR_END':
          if (token.trim() && token !== '\n') {
            throw new FXQLParserError(
              `FXQL statements must be separated by a single newline`,
              this.line,
              this.column,
            );
          }
          this.resetStructure();
          this.expectedToken = 'CURRENCY_PAIR';
          break;

        default:
          throw new FXQLParserError(
            `Unexpected parser state`,
            this.line,
            this.column,
          );
      }

      this.currentToken = '';
    } catch (err) {
      throw new FXQLParserError(
        `${(err as Error).message}`,
        this.line,
        this.column,
      );
    }
  }

  parse() {
    for (const char of this.input) {
      if (char === '\n') {
        // Handle blank lines
        if (
          !this.currentToken.trim() &&
          this.expectedToken === 'NEWLINE_OR_END'
        ) {
          this.lastLineWasEmpty = true;
          this.line++;
          this.column = 0;
          continue;
        }

        // Process current token
        this.validateToken();
        this.line++;
        this.column = 0;

        // Ensure valid separation between statements
        if (this.expectedToken === 'NEWLINE_OR_END') {
          if (this.lastLineWasEmpty) {
            this.lastLineWasEmpty = false;
          } else {
            this.resetStructure();
            this.expectedToken = 'CURRENCY_PAIR';
          }
        }
      } else if (char === ' ') {
        this.validateToken();
        this.column++;
      } else {
        this.currentToken += char;
        this.column++;
      }
    }

    this.validateToken(); // Validate any remaining token
    if (this.currentStructure.length > 0) {
      this.finalizeEntry();
    }
  }

  private finalizeEntry() {
    if (this.currentStructure.length === 0) return;

    const [sourceCurrency, destinationCurrency] =
      this.currentStructure[0].slice(1);

    const functions = Object.fromEntries(
      this.currentStructure
        .filter(([type]) => type === 'FUNCTION_CALL')
        .map(([, func, value]) => {
          const key = this.mapFunctionToKey(func);
          return [key, parseFloat(value)];
        }),
    );

    this.parsedEntries.push({
      EntryId: this.parsedEntries.length + 1,
      SourceCurrency: sourceCurrency,
      DestinationCurrency: destinationCurrency,
      ...functions,
    });

    this.resetStructure();
  }

  private mapFunctionToKey(functionName: string): keyof Entry {
    switch (functionName) {
      case 'BUY':
        return 'BuyPrice';
      case 'SELL':
        return 'SellPrice';
      case 'CAP':
        return 'CapAmount';
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  getEntries(): Entry[] {
    return this.parsedEntries;
  }
}

// Example Usage
// const input = `
// USD-GBP {
//  BUY 100
//  SELL 200
//  CAP 93800
// }
//   `;

// try {
//   const parser = new FXQLParser(input);
//   parser.parse();
//   console.log(parser.getEntries());
// } catch (error) {
//   console.error((error as Error).message);
// }
