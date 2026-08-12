import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { NET_PULSE } from '../constants';

// Output channel for build logs
let outputChannel: vscode.OutputChannel | undefined;

// Supported project file extensions
export const projectExtensions = ['.csproj', '.esproj', '.sln', '.slnx', '.slnf'];

/**
 * Gets or creates the output channel for build logs
 */
export function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('Build');
    }
    return outputChannel;
}

/**
 * Disposes resources used by this feature
 */
export function disposeBuildProject(): void {
    if (outputChannel) {
        outputChannel.dispose();
        outputChannel = undefined;
    }
}

/**
 * Common function to process a project (build or run) by finding the nearest .csproj file
 * @param uri - The URI of the selected file (optional, uses active editor if not provided)
 * @param actionName - The name of the action (e.g., 'Building', 'Running')
 * @param executeFunction - The function to execute the action (executeBuild or executeRun)
 */
export async function processProject(
    uri: vscode.Uri | undefined,
    actionName: string,
    executeFunction: (filePath: string, channel: vscode.OutputChannel, projectInfoMessage: string) => Promise<void | boolean>
): Promise<void> {
    let startPath: string | undefined;

    // If a URI was provided (right-click context menu), use it
    if (uri) {
        startPath = uri.fsPath;
    } else {
        // Otherwise, use the active editor's file
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            startPath = activeEditor.document.uri.fsPath;
        }
    }

    if (!startPath) {
        vscode.window.showErrorMessage(`${NET_PULSE}No file selected. Please open a file or right-click on a file in the explorer.`);
        return;
    }

    const channel = getOutputChannel();
    channel.show(true);
    channel.clear();

    // Check if the selected file is a project file
    const ext = path.extname(startPath).toLowerCase();
    if (projectExtensions.includes(ext)) {
        const csprojFileName = startPath ? path.basename(startPath) : '[None]';

        channel.appendLine(`${NET_PULSE}${actionName} ${csprojFileName}`);
        channel.appendLine('');
        await executeFunction(startPath, channel, `${NET_PULSE}${actionName} ${csprojFileName}`);
        return;
    }

    channel.appendLine(`${NET_PULSE}Searching a project for: ${startPath}`);

    // Find the nearest .csproj file
    const csprojPath = findNearestCsproj(startPath);
    const csprojFileName = csprojPath ? path.basename(csprojPath) : '[None]';

    if (!csprojPath) {
        channel.appendLine(`${NET_PULSE}Error: No .csproj file found for the active file ${startPath}.`);
        vscode.window.showErrorMessage(`${NET_PULSE}No .csproj file found in the current directory or parent directories.`);
        return;
    }

    channel.appendLine(`${NET_PULSE}Found nearest project: ${csprojFileName}`);

    // Execute the action with the found .csproj with the project info message displayed in green in the terminal
    await executeFunction(csprojPath, channel, `${NET_PULSE}${actionName} project: ${csprojFileName}`);
}

/**
 * Helper function to find the nearest .csproj file by traversing up the directory tree
 */
export function findNearestCsproj(startPath: string): string | undefined {
    let currentDir = fs.statSync(startPath).isDirectory() ? startPath : path.dirname(startPath);
    const root = path.parse(currentDir).root;

    while (currentDir && currentDir !== root) {
        try {
            const files = fs.readdirSync(currentDir);
            const projectFile = files.find(file => projectExtensions.some(ext => file.endsWith(ext)));
            if (projectFile) {
                return path.join(currentDir, projectFile);
            }
        } catch {
            // Continue searching if we can't read the directory
        }
        currentDir = path.dirname(currentDir);
    }

    return undefined;
}

/**
 * Gets the target DLL path by querying MSBuild properties (fast, no build)
 * @param csprojPath - The path to the .csproj file
 * @param channel - The output channel for logging
 * @returns The path to the target DLL, or undefined if the command fails
 */
export async function getTargetDllPath(csprojPath: string, channel: vscode.OutputChannel): Promise<string | undefined> {
    return new Promise((resolve) => {
        const { exec } = require('child_process');

        // Use MSBuild property evaluation (fast, doesn't build)
        const command = `dotnet msbuild "${csprojPath}" /getProperty:TargetPath /nologo`;

        exec(command, { cwd: path.dirname(csprojPath) }, (error: any, stdout: string, stderr: string) => {
            if (error) {
                channel.appendLine(`${NET_PULSE}Error getting target path: ${error.message}`);
                resolve(undefined);
                return;
            }

            // The output should be the path to the DLL
            const dllPath = stdout.trim();

            if (dllPath && !dllPath.includes('error')) {
                channel.appendLine(`${NET_PULSE}Target DLL: ${dllPath}`);
                resolve(dllPath);
            } else {
                channel.appendLine(`${NET_PULSE}Could not determine target DLL path`);
                resolve(undefined);
            }
        });
    });
}
