import * as vscode from 'vscode';
import { NET_PULSE } from '../constants';
import { processProject } from './shared';
import { executeBuild } from './build';

/**
 * Builds the solution using C# Dev Kit integration
 * First checks if a solution is opened, if not prompts to open one
 */
export async function buildSolution(): Promise<void> {

    // Check if C# Dev Kit extension is installed and activated
    const csDevKitExtension = vscode.extensions.getExtension('ms-dotnettools.csdevkit');

    if (!csDevKitExtension) {
        vscode.window.showErrorMessage(`${NET_PULSE}C# Dev Kit extension is not installed. Please install it to use this feature.`);
        return;
    }

    // Ensure the extension is activated
    if (!csDevKitExtension.isActive) {
        await csDevKitExtension.activate();
    }

    // Check for opened solution
    let solution = csDevKitExtension?.exports.testHooks.views.solutionExplorerProvider.solutionRoot?.resourceUri?.path;
    if (!solution) {
        solution = await vscode.commands.executeCommand('csdevkit.openSolution');
    }

    if (!solution) {
        vscode.window.showErrorMessage(`${NET_PULSE}No solution is opened. Please open a solution to build.`);
        return;
    }

    const uri = vscode.Uri.file(solution);
    await processProject(uri, 'Building', executeBuild);
}
