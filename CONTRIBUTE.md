# Contributing to .NET Pulse

Thank you for contributing to .NET Pulse. This project is a TypeScript extension for Visual Studio Code.

## Prerequisites

Install the following tools before you begin:

- [Node.js](https://nodejs.org/) with npm
- [Visual Studio Code](https://code.visualstudio.com/) 1.85.0 or later
- Git

## Update Your Local Checkout

Clone the repository, or update an existing checkout:

```powershell
git clone https://github.com/dvoituron/vscode-netpulse.git
cd vscode-netpulse
```

Use `npm install` after changes to `package.json`. Commit the resulting `package-lock.json` changes together with `package.json` when dependencies are updated.

Source code is under `src/`. Extension commands, settings, menus, and keyboard shortcuts are declared in `package.json`. Update `README.md` when a user-facing command or setting changes.

## Build and Test

Compile the extension:

```powershell
npm run compile
```

During development, keep TypeScript compiling as files change:

```powershell
npm run watch
```

Press `F5` in VS Code to open an Extension Development Host and test the extension interactively.

Before submitting a change, run:

```powershell
npm run lint
npm test
```

The compiled JavaScript is written to `out/` and should not be committed.

## Package

Create a VSIX package:

```powershell
npm run package
```

This runs the pre-publish compilation automatically and creates a file such as `dotnet-pulse-1.0.10.vsix` in the repository root.
Replace the version in the file name with the version currently declared in `package.json`. VSIX files are ignored by Git and should not be committed.

## Submit a Contribution

Keep changes focused, compile and test them locally, then push your branch and open a pull request against `main`. Describe the behavior changed and the validation performed in the pull request.
