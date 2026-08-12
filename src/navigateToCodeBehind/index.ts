import * as vscode from 'vscode';
import { navigateToCodeBehind } from './navigate';

/**
 * Register the navigate to code-behind feature
 */
export function registerNavigateToCodeBehind(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('netpulse.navigateToCodeBehind', navigateToCodeBehind);
    context.subscriptions.push(command);
}
