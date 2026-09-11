# Contributing to Codex Trading

Thank you for your interest in contributing to Codex Trading!

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect differing viewpoints

## How to Contribute

### Reporting Bugs

1. Check existing issues first
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear use case
   - Proposed solution
   - Alternatives considered

### Development Setup

```bash
# Fork and clone the repository
git clone <your-fork-url>
cd codex-trading

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Set up database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development
npm run dev
```

### Code Standards

- Use TypeScript strict mode
- Follow existing code style
- Write tests for new features
- Update documentation
- Keep commits atomic and descriptive

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass: `npm test`
4. Ensure lint passes: `npm run lint`
5. Update README if needed
6. Submit PR with clear description

## Project Structure

See README.md for project structure details.

## Questions?

Open an issue for any questions about contributing.