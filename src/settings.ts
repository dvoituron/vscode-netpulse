import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Represents a documentation item with a label and URL
 */
export interface DocumentationItem {
    label: string;
    url: string;
}

/**
 * Settings manager for dotnetPulse extension
 */
export class DotnetPulseSettings {
    /**
     * Gets the configured project URI from settings
     * @returns The URI of the configured project, or undefined if not found or invalid
     */
    public static projectUri(): vscode.Uri | undefined {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        const configuredProject = config.get<string>('projectUri');

        if (!configuredProject) {
            return undefined;
        }

        // Get the workspace root folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return undefined;
        }

        // Build the absolute path
        const projectPath = path.join(workspaceFolder.uri.fsPath, configuredProject);

        // Check if the file exists
        if (!fs.existsSync(projectPath)) {
            return undefined;
        }

        return vscode.Uri.file(projectPath);
    }

    /**
     * Gets the configured project arguments from settings
     * @returns An array of arguments to pass to the project, or empty array if not configured
     */
    public static runArgs(): string[] {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        return config.get<string[]>('runArgs') || [];
    }

    /**
     * Gets the arguments for manual project and solution builds
     * @returns An array of arguments to pass to dotnet build, or empty array if not configured
     */
    public static buildArgs(): string[] {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        return config.get<string[]>('buildArgs') || [];
    }

    /**
     * Gets the arguments for the build performed before running or debugging the configured project
     * @returns An array of arguments to pass to dotnet build, or empty array if not configured
     */
    public static runBuildArgs(): string[] {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        return config.get<string[]>('runBuildArgs') || [];
    }

    /**
     * Gets the configured pre-launch task from settings
     * @returns The pre-launch task name, or empty string if not configured
     */
    public static projectPreLaunchTask(): string {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        return config.get<string>('projectPreLaunchTask') || '';
    }

    /**
     * Gets whether the project should be built before running or debugging
     * @returns true by default to preserve the existing launch behavior
     */
    public static buildBeforeRun(): boolean {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        return config.get<boolean>('buildBeforeRun', true);
    }

    /**
     * Gets the configured build to console setting from settings (internalConsole, integratedTerminal, externalTerminal)
     * @returns The build to console configuration, or empty string if not configured
     */
    public static projectBuildToConsole(): string {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        return config.get<string>('projectBuildToConsole') || 'internalConsole';
    }

    /**
     * Gets the configured path to the sound file played when a build succeeds
     * @returns The path to the .wav file, or empty string if disabled
     */
    public static buildSuccessSound(): string {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        return config.get<string>('buildSuccessSound') ?? '';
    }

    /**
     * Gets the configured path to the sound file played when a build fails
     * @returns The path to the .wav file, or empty string if disabled
     */
    public static buildFailureSound(): string {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        return config.get<string>('buildFailureSound') ?? '';
    }

    /**
     * Gets the user-defined overrides for the debug/run configuration.
     * Only the following keys are honored: type, request, program, args, cwd,
     * stopAtEntry, requireExactSource, noDebug.
     * @returns A partial debug configuration object with override values, or empty object if not configured
     */
    public static startConfiguration(): Partial<vscode.DebugConfiguration> {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        const raw = config.get<Record<string, unknown>>('startConfiguration') || {};
        const allowedKeys = [
            'type',
            'request',
            'program',
            'args',
            'cwd',
            'stopAtEntry',
            'requireExactSource',
            'noDebug'
        ] as const;

        const result: Record<string, unknown> = {};
        for (const key of allowedKeys) {
            if (raw[key] !== undefined) {
                result[key] = raw[key];
            }
        }
        return result as Partial<vscode.DebugConfiguration>;
    }

    /**
     * Gets the configured documentation URLs from settings
     * @returns An array of documentation items with labels and URLs
     */
    public static documentationUrls(): DocumentationItem[] {
        const config = vscode.workspace.getConfiguration('dotnetPulse');
        return config.get<DocumentationItem[]>('documentationUrls') || [];
    }
}
