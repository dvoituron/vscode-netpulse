import * as vscode from 'vscode';
import { compareWithUnmodified } from './compareWithUnmodified';
import { viewHistory } from './viewHistory';
import { configUser } from './configUser';

/**
 * Registers the "Git: Compare with unmodified" command
 * @param context - The extension context for managing subscriptions
 */
export function registerGitCompareWithUnmodified(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand(
        'netpulse.gitCompareWithUnmodified',
        (uri: vscode.Uri) => {
            compareWithUnmodified(uri);
        }
    );

    context.subscriptions.push(disposable);
}

/**
 * Registers the "Git: View history" command
 * @param context - The extension context for managing subscriptions
 */
export function registerGitViewHistory(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand(
        'netpulse.gitViewHistory',
        (uri: vscode.Uri) => {
            viewHistory(uri);
        }
    );

    context.subscriptions.push(disposable);
}

/**
 * Registers the "Git: Config User" command
 * @param context - The extension context for managing subscriptions
 */
export function registerGitConfigUser(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand(
        'netpulse.gitConfigUser',
        () => {
            configUser();
        }
    );

    context.subscriptions.push(disposable);
}
