# Contributing to Desktop Interoperability Platform

Thank you for your interest in contributing to the Desktop Interoperability Platform! This document provides guidelines and instructions for contributing to this open-source project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful, inclusive, and considerate in all interactions.

### Our Standards

- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- npm or yarn
- Git
- TypeScript knowledge
- Electron experience (helpful)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/open-openfin.git
cd open-openfin
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/sanjeev23oct/open-openfin.git
```

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

### Run Tests

```bash
npm test
```

---

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Fixes** - Fix issues and bugs
2. **New Features** - Implement new functionality
3. **Documentation** - Improve or add documentation
4. **Tests** - Add or improve test coverage
5. **Examples** - Create sample applications
6. **Performance** - Optimize performance
7. **Refactoring** - Improve code quality

### Finding Issues to Work On

- Check the [Issues](https://github.com/sanjeev23oct/open-openfin/issues) page
- Look for issues labeled `good first issue` or `help wanted`
- Comment on an issue to let others know you're working on it

### Reporting Bugs

When reporting bugs, please include:

- **Description** - Clear description of the bug
- **Steps to Reproduce** - Detailed steps to reproduce the issue
- **Expected Behavior** - What you expected to happen
- **Actual Behavior** - What actually happened
- **Environment** - OS, Node version, platform version
- **Screenshots** - If applicable
- **Logs** - Relevant error messages or logs

**Bug Report Template:**

```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [e.g., Windows 11]
- Node.js: [e.g., 20.10.0]
- Platform Version: [e.g., 0.1.0]

## Additional Context
[Any other relevant information]
```

### Suggesting Features

When suggesting features, please include:

- **Use Case** - Why is this feature needed?
- **Proposed Solution** - How should it work?
- **Alternatives** - Other solutions you've considered
- **Examples** - Similar features in other platforms

**Feature Request Template:**

```markdown
## Feature Description
[Clear description of the feature]

## Use Case
[Why is this feature needed?]

## Proposed Solution
[How should it work?]

## Alternatives Considered
[Other solutions you've considered]

## Additional Context
[Any other relevant information]
```

---

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/add-window-grouping` - New features
- `fix/crash-on-startup` - Bug fixes
- `docs/api-documentation` - Documentation
- `refactor/service-registry` - Refactoring
- `test/window-manager` - Tests

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance tasks

**Examples:**

```
feat(fdc3): add private channel support

Implements private channel creation and management
as per FDC3 2.0 specification.

Closes #123
```

```
fix(window): prevent crash on window close

Fixed null pointer exception when closing windows
with active event listeners.

Fixes #456
```

### Development Process

1. **Create a Branch**

```bash
git checkout -b feature/my-feature
```

2. **Make Changes**

- Write code
- Add tests
- Update documentation

3. **Test Your Changes**

```bash
npm test
npm run lint
npm run build
```

4. **Commit Your Changes**

```bash
git add .
git commit -m "feat(scope): description"
```

5. **Push to Your Fork**

```bash
git push origin feature/my-feature
```

6. **Create Pull Request**

- Go to GitHub
- Click "New Pull Request"
- Fill out the PR template
- Submit for review

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Provide type definitions
- Avoid `any` type when possible

**Example:**

```typescript
// Good
interface WindowOptions {
  width: number;
  height: number;
  frame: boolean;
}

function createWindow(options: WindowOptions): Window {
  // Implementation
}

// Bad
function createWindow(options: any): any {
  // Implementation
}
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use meaningful variable names
- Add comments for complex logic

**Example:**

```typescript
// Good
const windowManager = new WindowManager();
const window = await windowManager.createWindow({
  width: 800,
  height: 600
});

// Bad
const wm = new WindowManager();
const w = await wm.createWindow({width:800,height:600})
```

### File Organization

```
packages/
├── runtime/
│   ├── src/
│   │   ├── services/
│   │   │   ├── WindowManager.ts
│   │   │   └── ApplicationLifecycleManager.ts
│   │   ├── types/
│   │   └── index.ts
│   ├── tests/
│   └── package.json
```

### Naming Conventions

- **Classes:** PascalCase (`WindowManager`)
- **Interfaces:** PascalCase with `I` prefix (`IWindowManager`)
- **Functions:** camelCase (`createWindow`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_WINDOWS`)
- **Files:** kebab-case (`window-manager.ts`)

---

## Testing Guidelines

### Test Structure

```typescript
describe('WindowManager', () => {
  let windowManager: WindowManager;
  
  beforeEach(() => {
    windowManager = new WindowManager();
  });
  
  afterEach(() => {
    windowManager.shutdown();
  });
  
  describe('createWindow', () => {
    it('should create a window with specified options', async () => {
      const window = await windowManager.createWindow({
        width: 800,
        height: 600
      });
      
      expect(window).toBeDefined();
      expect(window.getBounds().width).toBe(800);
    });
    
    it('should throw error for invalid options', async () => {
      await expect(
        windowManager.createWindow({ width: -1 })
      ).rejects.toThrow('Invalid width');
    });
  });
});
```

### Test Coverage

- Aim for 80%+ code coverage
- Test happy paths and error cases
- Test edge cases
- Mock external dependencies

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- window-manager.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Documentation

### Code Documentation

Use JSDoc comments for public APIs:

```typescript
/**
 * Creates a new window with the specified options.
 * 
 * @param options - Window configuration options
 * @returns Promise that resolves to the created window
 * @throws {InvalidArgumentError} If options are invalid
 * 
 * @example
 * ```typescript
 * const window = await windowManager.createWindow({
 *   width: 800,
 *   height: 600,
 *   frame: true
 * });
 * ```
 */
async createWindow(options: WindowOptions): Promise<Window> {
  // Implementation
}
```

### README Updates

Update README.md when:

- Adding new features
- Changing installation process
- Updating requirements
- Adding new examples

### API Documentation

Update docs/API.md when:

- Adding new APIs
- Changing API signatures
- Deprecating APIs
- Adding examples

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### PR Template

```markdown
## Description
[Clear description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #[issue number]

## Testing
[How was this tested?]

## Screenshots
[If applicable]

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass
```

### Review Process

1. **Automated Checks** - CI/CD runs tests and linting
2. **Code Review** - Maintainers review code
3. **Feedback** - Address review comments
4. **Approval** - Get approval from maintainers
5. **Merge** - Maintainer merges PR

### After Merge

- Delete your branch
- Update your fork
- Celebrate! 🎉

---

## Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General discussions and questions
- **Pull Requests** - Code contributions

### Getting Help

- Check existing issues and discussions
- Read the documentation
- Ask questions in discussions
- Be patient and respectful

### Recognition

Contributors are recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project README

---

## Development Setup

### Recommended Tools

- **IDE:** Visual Studio Code
- **Extensions:**
  - ESLint
  - Prettier
  - TypeScript
  - Jest

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Debugging

Launch configuration for VS Code:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["packages/runtime/src/main.ts"],
      "outputCapture": "std"
    }
  ]
}
```

---

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have questions about contributing, please:

1. Check existing documentation
2. Search closed issues
3. Ask in GitHub Discussions
4. Open a new issue

Thank you for contributing! 🚀
