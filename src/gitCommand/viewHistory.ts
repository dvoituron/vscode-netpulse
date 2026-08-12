import * as vscode from 'vscode';
import { NET_PULSE } from '../constants';

/**
 * Opens the Timeline view for the selected file to show its git history
 * @param uri - The URI of the file to view history for
 */
export async function viewHistory(uri: vscode.Uri): Promise<void> {
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
        // Open the Timeline view for the file
        await vscode.commands.executeCommand('timeline.focus');
        
        // Open the file to ensure Timeline shows its history
        await vscode.window.showTextDocument(uri, { preview: false });
        
    } catch (error) {
        vscode.window.showErrorMessage(
            `${NET_PULSE}Failed to open timeline: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}
