import * as vscode from 'vscode';
import * as path from 'path';
import { NET_PULSE } from '../constants';
import { DotnetPulseSettings } from '../settings';
import { processProject, getTargetDllPath } from './shared';
import { executeBuild } from './build';

/**
 * Debugs a project by finding the nearest .csproj file from the selected file or active editor
 * @param uri - The URI of the selected file (optional, uses active editor if not provided)
 */
export async function debugProject(uri?: vscode.Uri): Promise<void> {
    const projectUri = DotnetPulseSettings.projectUri() ?? uri;
    await processProject(projectUri, 'Debugging', executeDebug);
}

/**
 * Executes the debug session for a .csproj file
 * @param filePath - The path to the .csproj file
 * @param channel - The output channel for logging
 * @param projectInfoMessage - Optional message to display before the debug session (e.g., "Found nearest project")
 */
async function executeDebug(filePath: string, channel: vscode.OutputChannel, projectInfoMessage: string): Promise<void> {
    const projectDir = path.dirname(filePath);

    channel.appendLine(`${NET_PULSE}${projectInfoMessage}`);

    if (DotnetPulseSettings.buildBeforeRun()) {
        const buildSuccess = await executeBuild(filePath, channel, projectInfoMessage);

        if (!buildSuccess) {
            channel.appendLine(`${NET_PULSE}Debug cancelled due to build failure.`);
            return;
        }
    } else {
        channel.appendLine(`${NET_PULSE}Skipping build because dotnetPulse.buildBeforeRun is disabled.`);
    }

    channel.appendLine(`${NET_PULSE}Starting debug session...`);

    // Get the target DLL path using MSBuild property evaluation (fast)
    const dllPath = await getTargetDllPath(filePath, channel);

    if (!dllPath) {
        vscode.window.showErrorMessage('Could not determine project DLL path.');
        channel.appendLine(`${NET_PULSE}Error: Could not determine project DLL path.`);
        return;
    }

    // Create a debug configuration
    const debugConfig: vscode.DebugConfiguration = {
        name: 'Debug Project',
        type: 'coreclr',  // Requires C# extension
        request: 'launch',
        preLaunchTask: DotnetPulseSettings.projectPreLaunchTask(),
        program: dllPath,
        args: DotnetPulseSettings.projectArgs(),
        cwd: projectDir,
        console: DotnetPulseSettings.projectBuildToConsole(),
        stopAtEntry: false,
        requireExactSource: false,
        logging: {
            moduleLoad: false,  // Suppress module load messages
            exceptions: true,
            programOutput: true
        },
        ...DotnetPulseSettings.startConfiguration()
    };

    try {
        const success = await vscode.debug.startDebugging(undefined, debugConfig);

        if (!success) {
            vscode.window.showErrorMessage('Failed to start debug session. Make sure the C# extension is installed.');
            channel.appendLine(`${NET_PULSE}Failed to start debug session.`);
        } else {
            channel.appendLine(`${NET_PULSE}Debug session started successfully.`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        channel.appendLine(`${NET_PULSE}Debug failed: ${errorMessage}`);
        vscode.window.showErrorMessage(`Debug failed: ${errorMessage}`);
    }
}
