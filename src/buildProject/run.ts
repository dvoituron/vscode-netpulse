import * as vscode from 'vscode';
import * as path from 'path';
import { NET_PULSE } from '../constants';
import { DotnetPulseSettings } from '../settings';
import { processProject, getTargetDllPath } from './shared';
import { executeBuild } from './build';

/**
 * Runs a project without debugging by finding the nearest .csproj file from the selected file or active editor
 * @param uri - The URI of the selected file (optional, uses active editor if not provided)
 */
export async function runProject(uri?: vscode.Uri): Promise<void> {
    const projectUri = DotnetPulseSettings.projectUri() ?? uri;
    await processProject(projectUri, 'Running', executeRun);
}

/**
 * Executes the dotnet run command for a .csproj file
 * @param filePath - The path to the .csproj file
 * @param channel - The output channel for logging
 * @param projectInfoMessage - Optional message to display before the run (e.g., "Found nearest project")
 */
async function executeRun(filePath: string, channel: vscode.OutputChannel, projectInfoMessage: string): Promise<void> {
    const projectDir = path.dirname(filePath);

    channel.appendLine(`${NET_PULSE}${projectInfoMessage}`);

    if (DotnetPulseSettings.buildBeforeRun()) {
        const buildSuccess = await executeBuild(filePath, channel, projectInfoMessage);

        if (!buildSuccess) {
            channel.appendLine(`${NET_PULSE}Run cancelled due to build failure.`);
            return;
        }
    } else {
        channel.appendLine(`${NET_PULSE}Skipping build because dotnetPulse.buildBeforeRun is disabled.`);
    }

    channel.appendLine(`${NET_PULSE}Starting without debugging...`);

    // Get the target DLL path using MSBuild property evaluation (fast)
    const dllPath = await getTargetDllPath(filePath, channel);

    if (!dllPath) {
        vscode.window.showErrorMessage('Could not determine project DLL path.');
        channel.appendLine(`${NET_PULSE}Error: Could not determine project DLL path.`);
        return;
    }

    // Create a debug configuration with noDebug flag
    // For Blazor WASM: use coreclr to run the host server without auto-launching a browser,
    // so the user can see the localhost URL in the console and click it manually.
    const debugConfig: vscode.DebugConfiguration = {
        name: 'Run Project',
        type: 'coreclr',  // Requires C# extension
        request: 'launch',
        preLaunchTask: DotnetPulseSettings.projectPreLaunchTask(),
        program: dllPath,
        args: DotnetPulseSettings.projectArgs(),
        cwd: projectDir,
        console: DotnetPulseSettings.projectBuildToConsole(),
        stopAtEntry: false,
        requireExactSource: true,
        noDebug: true,  // Run without attaching debugger
        logging: {
            moduleLoad: false,  // Suppress module load messages
            exceptions: true,
            programOutput: true
        },
        ...DotnetPulseSettings.startConfiguration() // Apply user overrides from settings
    };

    // Check if it's a Blazor WebAssembly project to set appropriate debug configuration
    // if (isBlazorWasmProject(filePath)) {
    //     debugConfig.name = 'Run Blazor WebAssembly';
    //     debugConfig.type = 'blazorwasm';  // Use Blazor WASM debug type for better experience
    //     debugConfig.program = null;
    // }

    try {
        const success = await vscode.debug.startDebugging(undefined, debugConfig);

        if (!success) {
            vscode.window.showErrorMessage('Failed to start run session. Make sure the C# extension is installed.');
            channel.appendLine(`${NET_PULSE}Failed to start run session.`);
        } else {
            channel.appendLine(`${NET_PULSE}Run session started successfully.`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        channel.appendLine(`${NET_PULSE}Run failed: ${errorMessage}`);
        vscode.window.showErrorMessage(`Run failed: ${errorMessage}`);
    }
}
