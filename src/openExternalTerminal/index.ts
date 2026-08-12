import * as vscode from 'vscode';
import { openInExternalTerminal } from './openTerminal';

/**
 * Registers the "Open in External Terminal" command
 * @param context - The extension context for managing subscriptions
 */
export function registerOpenExternalTerminal(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand(
        'externalTerminal.openInTerminal',
        (uri: vscode.Uri) => {
            openInExternalTerminal(uri);
        }
    );

    context.subscriptions.push(disposable);
}
