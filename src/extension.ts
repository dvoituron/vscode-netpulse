// Import the VS Code API module
import * as vscode from 'vscode';

// Import feature modules
import { registerOpenExternalTerminal } from './openExternalTerminal/index';
import { registerBuildProject, disposeBuildProject } from './buildProject/index';
import { registerNavigateToCodeBehind } from './navigateToCodeBehind/index';
import { registerGitCompareWithUnmodified, registerGitViewHistory, registerGitConfigUser } from './gitCommand/index';
import { registerOpenDocumentation } from './documentation/index';

/**
 * This function is called when your extension is activated
 * Activation happens when the user triggers a command defined in package.json
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('NetPulse extension is now active!');

    // Register all features
    registerOpenExternalTerminal(context);
    registerBuildProject(context);
    registerNavigateToCodeBehind(context);
    registerGitCompareWithUnmodified(context);
    registerGitViewHistory(context);
    registerGitConfigUser(context);
    registerOpenDocumentation(context);
}

/**
 * This function is called when your extension is deactivated
 * Use this to clean up any resources if needed
 */
export function deactivate() {
    disposeBuildProject();
}
