# Code formatting

This project uses [Prettier](https://prettier.io/) for consistent style across the codebase.

## Per-project setup

- **user-app** and **rider-app**: `.prettierrc.json` (4 spaces, single quotes, trailing commas). Run `npm run format`.
- **backend**: `.prettierrc.json` (2 spaces, single quotes). Run `npm run format`.

Each app has a `.prettierignore` that excludes `node_modules`, build outputs, and lock files.

## When to format

- Before committing, run `npm run format` in the app or backend you changed.
- CI can optionally run `prettier --check` to ensure no unformatted files are committed.

## Safe to run

Formatting only changes whitespace, quotes, and line breaks. It does not change logic or behaviour.
