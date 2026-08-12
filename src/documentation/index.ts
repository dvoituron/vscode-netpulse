import * as vscode from 'vscode';
import { openDocumentation, hasDocumentationUrls } from './openDocumentation';

/**
 * Registers the "Open Documentation" command
 * @param context - The extension context for managing subscriptions
 */
export function registerOpenDocumentation(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand(
        'netpulse.openDocumentation',
        () => {
            openDocumentation();
        }
    );

    context.subscriptions.push(disposable);

    // Set initial context for menu visibility
    updateDocumentationContext();

    // Listen for configuration changes to update visibility
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('dotnetPulse.documentationUrls')) {
                updateDocumentationContext();
            }
        })
    );
}

/**
 * Updates the context key for documentation visibility
 */
function updateDocumentationContext(): void {
    vscode.commands.executeCommand(
        'setContext',
        'netpulse.hasDocumentationUrls',
        hasDocumentationUrls()
    );
}
