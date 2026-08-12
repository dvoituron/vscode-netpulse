import * as vscode from 'vscode';
import * as path from 'path';
import { NET_PULSE } from '../constants';
import { processProject } from './shared';
import { DotnetPulseSettings } from '../settings';
import { SoundPlayer } from './soundPlayer';

/**
 * Builds a project by finding the nearest .csproj file from the selected file or active editor
 * @param uri - The URI of the selected file (optional, uses active editor if not provided)
 */
export async function buildProject(uri?: vscode.Uri): Promise<void> {
    await processProject(uri, 'Building', executeBuild);
}

/**
 * Executes the dotnet build command for a .csproj file
 * @param filePath - The path to the .csproj file
 * @param channel - The output channel for logging
 * @param projectInfoMessage - Optional message to display before the build (e.g., "Found nearest project")
 * @returns Promise<boolean> - true if build succeeded, false otherwise
 */
export async function executeBuild(filePath: string, channel: vscode.OutputChannel, projectInfoMessage: string): Promise<boolean> {
    // Check if there's an active debug session and stop it
    if (vscode.debug.activeDebugSession) {
        channel.appendLine(`${NET_PULSE}Stopping active debug session...`);
        await vscode.debug.stopDebugging(vscode.debug.activeDebugSession);
        // Wait a bit for the session to fully stop
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const projectDir = path.dirname(filePath);
    const projectFileName = path.basename(filePath);
    const command = `dotnet build '${projectFileName.replace(/'/g, "''")}'`;

    channel.appendLine(`${NET_PULSE} $> ${command}`);

    // Build the shell command with optional green-colored project info message
    // Use PowerShell Write-Host for green text output on a single line
    let shellCommand = `pwsh -NoProfile -Command "Write-Host '${projectInfoMessage.replace(/'/g, "''")}' -ForegroundColor Green; ${command}"`;

    // Create a terminal task to run dotnet build
    const task = new vscode.Task(
        { type: 'shell' },
        vscode.TaskScope.Workspace,
        'Build Project',
        'dotnet',
        new vscode.ShellExecution(shellCommand, {
            cwd: projectDir
        })
    );

    // Hide the command from the terminal output
    task.presentationOptions = {
        reveal: vscode.TaskRevealKind.Always,
        panel: vscode.TaskPanelKind.Shared,
        clear: true,
        echo: false
    };

    return new Promise<boolean>((resolve) => {
        vscode.tasks.executeTask(task).then((execution) => {
            // Listen for task completion
            const disposable = vscode.tasks.onDidEndTaskProcess((e) => {
                if (e.execution === execution) {
                    if (e.exitCode === 0) {
                        SoundPlayer.play(DotnetPulseSettings.buildSuccessSound(), channel);
                        disposable.dispose();
                        resolve(true);
                    } else {
                        channel.appendLine(`${NET_PULSE} Build failed with exit code: ${e.exitCode}`);
                        vscode.window.showErrorMessage(`Build failed with exit code: ${e.exitCode}`);
                        SoundPlayer.play(DotnetPulseSettings.buildFailureSound(), channel);
                        disposable.dispose();
                        resolve(false);
                    }
                }
            });
        }, (error: any) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            channel.appendLine(`${NET_PULSE}Build failed: ${errorMessage}`);
            SoundPlayer.play(DotnetPulseSettings.buildFailureSound(), channel);
            resolve(false);
        });
    });
}
