# FXQL Parser

This is an FXQL Parser written in Typescript solely for the [mira assessment](https://miraapp.notion.site/Backend-Developer-Technical-Assessment-a954df277ad34772a261ddfe2dd7210c). This parser can best be described as a custom-built state machine parser. Here's a breakdown of how it compares to more formal parsing frameworks like EBNF-based parsers or Lark:

#### Basics

- It's a procedural parser designed using a state machine approach, where the parser transitions between predefined states (`CURRENCY_PAIR`, `LBRACE`, `FUNC_NAME`, etc.) based on input tokens.
- Each state has explicit rules defining valid inputs and the next states.

#### Strengths

- Simplicity: Designed specifically for FXQL, which allows fine-tuning for its exact requirements.
- Clear Error Handling: Since I explicitly track states and transitions, it becomes easier to identify and report errors with precise context (e.g., line numbers, columns).
- Flexibility: I can modify rules directly without needing to refactor an entire grammar.

#### Limitations

- Manual State Management: Adding new rules or features might require significant changes to the state transition logic.
- Less Formal: It lacks the reusability of a grammar-based approach i.e EBNF based parsers.
- Performance: Parsing logic might become less efficient or harder to optimize compared to a formal parser generator.

Overall, this is an optimal and quick way to build a nice and effective parser in such little time. Also, this implementation's approach would be best since we'd want to give detailed and easy-to-debug-with errors.

## Features

- Currency Pair Validation: Ensures pairs like `USD-GBP` are properly formatted (uppercase and hyphen-separated).
- Function Validation: Recognizes and enforces constraints for `BUY`, `SELL`, and `CAP` functions.
- Error Reporting: Provides clear, **line-by-line** error messages with line and column details.
- Input Sanitization: Ignores extra whitespace and blank lines between statements.
- Comprehensive Parsing: Parses FXQL blocks into structured JSON for further processing.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test
```
