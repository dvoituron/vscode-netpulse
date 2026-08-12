import * as vscode from 'vscode';
import { NET_PULSE } from '../constants';

/**
 * Opens the diff view comparing the current file with its unmodified version in git
 * @param uri - The URI of the file to compare
 */
export async function compareWithUnmodified(uri: vscode.Uri): Promise<void> {
    // If no URI is provided (e.g., from keyboard shortcut), try to get the active file
    if (!uri) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            uri = activeEditor.document.uri;
        } else {
            vscode.window.showErrorMessage(`${NET_PULSE}No file selected`);
            return;
        }
    }

    try {
        // Get the git extension
        const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
        if (!gitExtension) {
            vscode.window.showWarningMessage(`${NET_PULSE}Git extension is not available`);
            return;
        }

        const git = gitExtension.getAPI(1);
        
        // Find the repository for this file
        const repository = git.repositories.find((repo: any) => 
            uri.fsPath.startsWith(repo.rootUri.fsPath)
        );

        if (!repository) {
            vscode.window.showInformationMessage(`${NET_PULSE}File is not in a git repository`);
            return;
        }

        // Check if the file has changes
        const relativePath = uri.fsPath.substring(repository.rootUri.fsPath.length + 1);
        const hasChanges = repository.state.workingTreeChanges.some((change: any) => 
            change.uri.fsPath === uri.fsPath
        ) || repository.state.indexChanges.some((change: any) => 
            change.uri.fsPath === uri.fsPath
        );

        if (!hasChanges) {
            vscode.window.showInformationMessage(`${NET_PULSE}No changes detected in this file`);
            return;
        }

        // Use VS Code's built-in git.openChange command which shows the diff
        // This is the same command that is executed when you click "Open Changes" in Source Control
        await vscode.commands.executeCommand('git.openChange', uri);
    } catch (error) {
        vscode.window.showErrorMessage(
            `${NET_PULSE}Failed to open git changes: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}
