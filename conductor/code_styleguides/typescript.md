# TypeScript Style Guide

## General Principles
- Use **TypeScript** for all logic to ensure type safety.
- Prefer **functional components** and modular design.
- Use **ES6 Modules** (`import`/`export`).

## Naming Conventions
- `camelCase` for variables and functions.
- `PascalCase` for classes and interfaces.
- `SCREAMING_SNAKE_CASE` for constants.
- Interfaces should be named without a leading `I`.

## Types
- Explicitly define return types for public functions.
- Avoid `any`. Use `unknown` if the type is truly unknown.
- Prefer `interface` over `type` for object definitions.

## Documentation
- Use JSDoc comments for public-facing methods and complex logic.
