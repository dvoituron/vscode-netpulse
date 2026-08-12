import * as vscode from 'vscode';
import { SUPPORTED_EXTENSIONS, getExtension, getBaseName } from './shared';

/**
 * Navigate from a .razor or .cshtml file to its associated code-behind file (.razor.cs or .cshtml.cs)
 */
export async function navigateToCodeBehind() {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found.');
        return;
    }

    const currentUri = editor.document.uri;
    const ext = getExtension(currentUri.path);

    // Check if the current file is a supported file type
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        vscode.window.showInformationMessage(`This command does not support files with the extension ${ext}.`);
        return;
    }

    // Construct the code-behind file URI
    const codeBehindUri = currentUri.with({ path: currentUri.path + '.cs' });

    // Check if the code-behind file exists
    try {
        await vscode.workspace.fs.stat(codeBehindUri);
    } catch {
        vscode.window.showWarningMessage(`Code-behind file not found: ${getBaseName(codeBehindUri.path)}`);
        return;
    }

    // Open the code-behind file
    try {
        const document = await vscode.workspace.openTextDocument(codeBehindUri);
        await vscode.window.showTextDocument(document, {
            preview: false,
            viewColumn: vscode.ViewColumn.Active
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open code-behind file: ${error}`);
    }
}
