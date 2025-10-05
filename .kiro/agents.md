# Agent Guidelines for File Organization

## File Organization Best Practices

When working on this project, please follow these file organization guidelines to keep the repository clean and maintainable.

### Root Directory

Keep ONLY these standard files at the root:
- `README.md` - Main project readme
- `LICENSE` - Project license
- `CONTRIBUTING.md` - Contribution guidelines
- `package.json` - NPM package configuration
- `tsconfig.json` - TypeScript configuration
- `.gitignore` - Git ignore rules
- `.eslintrc.json` - ESLint configuration
- `jest.config.js` - Jest test configuration

### Documentation Files

All documentation should go in the `docs/` directory:

- **`docs/guides/`** - User guides, tutorials, and how-to documents
  - Examples: QUICK-START.md, PLATFORM-GUIDE.md, BUILD-INSTRUCTIONS.md
  
- **`docs/summaries/`** - Project summaries, progress reports, task summaries
  - Examples: FINAL-SUMMARY.md, PROGRESS.md, TASK-XX-SUMMARY.md
  
- **`docs/`** (root) - API documentation, specifications, and reference docs
  - Examples: API.md, MANIFEST.md, CONFIGURATION.md

### Test Files

All test files should go in the `tests/` directory:
- `tests/test-*.js` - Test scripts
- `tests/*.test.ts` - Unit tests
- `tests/*.spec.ts` - Spec tests
- `tests/fixtures/` - Test fixtures and mock data

### Spec Files

Specification documents should go in `.kiro/specs/`:
- `.kiro/specs/{feature-name}/requirements.md`
- `.kiro/specs/{feature-name}/design.md`
- `.kiro/specs/{feature-name}/tasks.md`

### Platform Files

Platform-specific files at root (these are OK):
- `platform-launcher.js` - Main platform launcher
- `platform-preload.js` - Platform preload script
- `create-icons.js` - Icon generation script

### Folders

- `apps/` - Sample applications
- `packages/` - NPM packages (monorepo structure)
- `platform-ui/` - Platform UI files
- `workspaces/` - Workspace configurations
- `assets/` - Images, icons, and other assets
- `docs/` - All documentation
- `tests/` - All test files
- `.kiro/` - Kiro IDE configuration and specs

## When Creating New Files

### Documentation
- **Guides/Tutorials** → `docs/guides/`
- **API/Reference** → `docs/`
- **Summaries/Reports** → `docs/summaries/`

### Tests
- **All test files** → `tests/`

### Specs
- **Feature specs** → `.kiro/specs/{feature-name}/`

### Code
- **Runtime code** → `packages/runtime/src/`
- **SDK types** → `packages/sdk/src/types/`
- **Services** → `packages/runtime/src/services/`

## Example File Placement

❌ **Wrong:**
```
/ADVANCED-WINDOW-MANAGEMENT-IMPLEMENTATION.md
/test-launcher.js
/TASK-14-SUMMARY.md
```

✅ **Correct:**
```
/docs/guides/ADVANCED-WINDOW-MANAGEMENT-IMPLEMENTATION.md
/tests/test-launcher.js
/docs/summaries/TASK-14-SUMMARY.md
```

## Naming Conventions

- **Documentation**: Use descriptive names with hyphens
  - `QUICK-START.md`, `API-REFERENCE.md`
  
- **Test files**: Prefix with `test-` or suffix with `.test.ts`
  - `test-launcher.js`, `window-manager.test.ts`
  
- **Spec files**: Use standard names
  - `requirements.md`, `design.md`, `tasks.md`

## Cleanup Checklist

Before committing, ensure:
- [ ] No loose .md files at root (except README, LICENSE, CONTRIBUTING)
- [ ] All test files are in `tests/`
- [ ] All documentation is in `docs/` subdirectories
- [ ] No build artifacts (.d.ts, .js in src/) are committed
- [ ] .gitignore is up to date

## Questions?

If unsure where a file should go, ask yourself:
1. Is it documentation? → `docs/`
2. Is it a test? → `tests/`
3. Is it a spec? → `.kiro/specs/`
4. Is it source code? → `packages/*/src/`
5. Is it configuration? → Root directory

When in doubt, prefer organizing into subdirectories rather than cluttering the root.
