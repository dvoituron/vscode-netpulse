import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { NET_PULSE } from '../constants';

const execAsync = promisify(exec);

/**
 * Gets the workspace folder path (cwd for git commands).
 */
function getWorkspaceCwd(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        return undefined;
    }
    return folders[0].uri.fsPath;
}

/**
 * Runs a git command and returns its trimmed stdout, or undefined if it fails.
 */
async function tryGitCommand(args: string, cwd: string): Promise<string | undefined> {
    try {
        const { stdout } = await execAsync(`git ${args}`, { cwd });
        const value = stdout.trim();
        return value.length > 0 ? value : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Prompts the user to configure a git config value (local repository scope),
 * pre-filling with the local value if defined, otherwise the global value.
 *
 * @param key - The git config key (e.g., "user.name", "user.email").
 * @param label - Human-readable label for prompts (e.g., "user name").
 */
async function configureGitValue(key: string, label: string): Promise<void> {
    const cwd = getWorkspaceCwd();
    if (!cwd) {
        vscode.window.showErrorMessage(`${NET_PULSE}No workspace folder is open`);
        return;
    }

    // Verify we are inside a git repository
    const isRepo = await tryGitCommand('rev-parse --is-inside-work-tree', cwd);
    if (isRepo !== 'true') {
        vscode.window.showErrorMessage(`${NET_PULSE}The current workspace is not a Git repository`);
        return;
    }

    // Try local first, then global
    let defaultValue = await tryGitCommand(`config ${key}`, cwd);
    let source = 'local';
    if (!defaultValue) {
        defaultValue = await tryGitCommand(`config --global ${key}`, cwd);
        source = 'global';
    }

    const input = await vscode.window.showInputBox({
        title: `Git: Configure ${label}`,
        prompt: defaultValue
            ? `Set the local Git ${label} (default from ${source} config)`
            : `Set the local Git ${label}`,
        value: defaultValue ?? '',
        ignoreFocusOut: true,
        validateInput: (val) => (val.trim().length === 0 ? `${label} cannot be empty` : undefined)
    });

    if (input === undefined) {
        return; // user cancelled
    }

    const trimmed = input.trim();
    try {
        // Quote the value safely by escaping embedded double quotes
        const escaped = trimmed.replace(/"/g, '\\"');
        await execAsync(`git config ${key} "${escaped}"`, { cwd });
        vscode.window.showInformationMessage(`${NET_PULSE}Local Git ${label} set to "${trimmed}"`);
    } catch (error) {
        vscode.window.showErrorMessage(
            `${NET_PULSE}Failed to set Git ${label}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Prompts the user to configure the local Git user.name and user.email for the
 * current repository, pre-filling defaults from local or global git config.
 */
export async function configUser(): Promise<void> {
    await configureGitValue('user.name', 'user name');
    await configureGitValue('user.email', 'user email');
}
