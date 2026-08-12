import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { NET_PULSE } from '../constants';

/**
 * Opens the selected file's directory in Windows Terminal
 * @param uri - The URI of the file that was right-clicked
 */
export function openInExternalTerminal(uri: vscode.Uri): void {
    // If no URI is provided (e.g., from keyboard shortcut), try to get the selected file from explorer
    if (!uri) {
        // Try to get the active file from the editor
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            uri = activeEditor.document.uri;
        } else {
            vscode.window.showErrorMessage(`${NET_PULSE}No file selected`);
            return;
        }
    }

    // Get the full file path from the URI
    const filePath = uri.fsPath;

    // Get the directory containing the file
    const directoryPath = path.dirname(filePath);

    // Get the file name (to display in the message)
    const fileName = path.basename(filePath);

    // Get the terminal configuration from VS Code settings
    const config = vscode.workspace.getConfiguration('externalTerminal');

    // Try to get custom terminal path, otherwise use Windows Terminal as default
    const terminalPath = config.get<string>('path') || 'wt.exe';

    // Build the command to open Windows Terminal in the file's directory
    const command = `"${terminalPath}" -d "${directoryPath}"`;

    // Execute the command to open the terminal
    exec(command, (error) => {
        if (error) {
            vscode.window.showErrorMessage(
                `${NET_PULSE}Failed to open external terminal: ${error.message}. ` +
                `Make sure Windows Terminal is installed or configure a custom terminal path.`
            );
            return;
        }
    });
}
