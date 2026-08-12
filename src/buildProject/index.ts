import * as vscode from 'vscode';
import { buildProject } from './build';
import { runProject } from './run';
import { debugProject } from './debug';
import { buildSolution } from './solution';

// Re-export for external use
export { disposeBuildProject } from './shared';

/**
 * Registers the "Build" command for .csproj files
 * @param context - The extension context for managing subscriptions
 */
export function registerBuildProject(context: vscode.ExtensionContext): void {
    // Register command for building project from any file (finds nearest .csproj)
    const buildProjectDisposable = vscode.commands.registerCommand(
        'netpulse.buildProject',
        (uri: vscode.Uri) => {
            buildProject(uri);
        }
    );

    // Register command for running project without debugging
    const runProjectDisposable = vscode.commands.registerCommand(
        'netpulse.runProject',
        (uri: vscode.Uri) => {
            runProject(uri);
        }
    );

    // Register command for debugging project
    const debugProjectDisposable = vscode.commands.registerCommand(
        'netpulse.debugProject',
        (uri: vscode.Uri) => {
            debugProject(uri);
        }
    );

    // Register command for building solution
    const buildSolutionDisposable = vscode.commands.registerCommand(
        'netpulse.buildSolution',
        () => {
            buildSolution();
        }
    );

    context.subscriptions.push(buildProjectDisposable, runProjectDisposable, debugProjectDisposable, buildSolutionDisposable);
}
