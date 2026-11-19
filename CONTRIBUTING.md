# Contributing to SYNTHWAVE

Thank you for your interest in contributing to SYNTHWAVE!

## Development Workflow

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   # Or on Windows PowerShell:
   npm.cmd install
   ```
3. Start the development server:
   ```bash
   npm run dev
   # Or on Windows PowerShell:
   npm.cmd run dev
   ```
4. Run tests before creating a pull request:
   ```bash
   npm test
   ```
5. Ensure production build succeeds:
   ```bash
   npm run build
   ```

## Pull Request Guidelines

- Ensure all existing tests pass and add unit tests for new features.
- Adhere to the existing TypeScript and React coding standards.
- Avoid unnecessary runtime allocations inside the Three.js 60fps render loop.
