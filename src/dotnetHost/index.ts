import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { NET_PULSE } from '../constants';

interface DotnetProcess {
    id: number;
    name: string;
    cpu: number | null;
    workingSet: number;
    path: string | null;
}

const execFileAsync = promisify(execFile);
let outputChannel: vscode.OutputChannel;

export function registerDotnetHost(context: vscode.ExtensionContext): void {
    outputChannel = vscode.window.createOutputChannel('.NET Host');

    const listDisposable = vscode.commands.registerCommand(
        'netpulse.dotnetHost.list',
        listDotnetHosts
    );
    const killAllDisposable = vscode.commands.registerCommand(
        'netpulse.dotnetHost.killAll',
        killAllDotnetHosts
    );

    context.subscriptions.push(outputChannel, listDisposable, killAllDisposable);
}

async function listDotnetHosts(): Promise<void> {
    try {
        const processes = await getDotnetProcesses();
        showProcessList(processes);
    } catch (error) {
        showCommandError('Could not list dotnet.exe processes', error);
    }
}

async function killAllDotnetHosts(): Promise<void> {
    let processes: DotnetProcess[];

    try {
        processes = await getDotnetProcesses();
    } catch (error) {
        showCommandError('Could not list dotnet.exe processes', error);
        return;
    }

    showProcessList(processes);

    if (processes.length === 0) {
        vscode.window.showInformationMessage('No running dotnet.exe processes were found.');
        return;
    }

    const confirmation = await vscode.window.showWarningMessage(
        `Kill all ${processes.length} running dotnet.exe ${processes.length === 1 ? 'process' : 'processes'}? This may stop applications, builds, and development tools.`,
        { modal: true },
        'Kill all'
    );

    if (confirmation !== 'Kill all') {
        outputChannel.appendLine('');
        outputChannel.appendLine(`${NET_PULSE}Kill all cancelled.`);
        return;
    }

    outputChannel.appendLine('');
    outputChannel.appendLine(`${NET_PULSE}Stopping dotnet.exe processes...`);

    const results = await Promise.all(processes.map(async processInfo => {
        try {
            const killed = await killDotnetProcess(processInfo.id);
            outputChannel.appendLine(
                killed
                    ? `${NET_PULSE}Stopped PID ${processInfo.id}.`
                    : `${NET_PULSE}PID ${processInfo.id} had already exited.`
            );
            return { killed, error: undefined };
        } catch (error) {
            const message = getErrorMessage(error);
            outputChannel.appendLine(`${NET_PULSE}Failed to stop PID ${processInfo.id}: ${message}`);
            return { killed: false, error: message };
        }
    }));

    const killedCount = results.filter(result => result.killed).length;
    const failureCount = results.filter(result => result.error !== undefined).length;
    const exitedCount = results.length - killedCount - failureCount;

    outputChannel.appendLine('');
    outputChannel.appendLine(
        `${NET_PULSE}Completed: ${killedCount} stopped, ${exitedCount} already exited, ${failureCount} failed.`
    );

    if (failureCount > 0) {
        vscode.window.showWarningMessage(
            `Stopped ${killedCount} dotnet.exe processes; ${failureCount} could not be stopped. See the .NET Host output for details.`
        );
    } else {
        vscode.window.showInformationMessage(
            `${killedCount} dotnet.exe ${killedCount === 1 ? 'process was' : 'processes were'} stopped.`
        );
    }
}

async function getDotnetProcesses(): Promise<DotnetProcess[]> {
    ensureWindows();

    const script = [
        "$processes = @(Get-Process -Name 'dotnet' -ErrorAction SilentlyContinue |",
        '    Sort-Object Id |',
        '    ForEach-Object {',
        '        [PSCustomObject]@{',
        '            id = $_.Id',
        '            name = $_.ProcessName',
        '            cpu = $_.CPU',
        '            workingSet = $_.WorkingSet64',
        '            path = $_.Path',
        '        }',
        '    })',
        "if ($processes.Count -eq 0) { Write-Output '[]' }",
        'else { $processes | ConvertTo-Json -Compress }'
    ].join('\n');

    const { stdout } = await execPowerShell(script);
    const parsed: unknown = JSON.parse(stdout.trim());
    const values = Array.isArray(parsed) ? parsed : [parsed];

    return values.map(parseDotnetProcess);
}

function parseDotnetProcess(value: unknown): DotnetProcess {
    if (!isRecord(value)
        || typeof value.id !== 'number'
        || typeof value.name !== 'string'
        || (value.cpu !== null && typeof value.cpu !== 'number')
        || typeof value.workingSet !== 'number'
        || (value.path !== null && typeof value.path !== 'string')) {
        throw new Error('PowerShell returned an unexpected process record.');
    }

    return {
        id: value.id,
        name: value.name,
        cpu: value.cpu,
        workingSet: value.workingSet,
        path: value.path
    };
}

async function killDotnetProcess(processId: number): Promise<boolean> {
    const script = [
        `$process = Get-Process -Id ${processId} -ErrorAction SilentlyContinue`,
        "if ($null -eq $process) { Write-Output 'not-found'; exit 0 }",
        `if ($process.ProcessName -ne 'dotnet') { throw 'PID ${processId} is no longer a dotnet.exe process.' }`,
        `Stop-Process -Id ${processId} -Force -ErrorAction Stop`,
        "Write-Output 'killed'"
    ].join('\n');

    const { stdout } = await execPowerShell(script);
    return stdout.trim() === 'killed';
}

async function execPowerShell(script: string): Promise<{ stdout: string; stderr: string }> {
    return execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', script],
        { windowsHide: true, maxBuffer: 1024 * 1024 }
    );
}

function showProcessList(processes: DotnetProcess[]): void {
    outputChannel.clear();
    outputChannel.show(true);
    outputChannel.appendLine(`${NET_PULSE}Running dotnet.exe processes: ${processes.length}`);
    outputChannel.appendLine('');

    if (processes.length === 0) {
        outputChannel.appendLine('No running dotnet.exe processes were found.');
        return;
    }

    outputChannel.appendLine(
        `${'PID'.padEnd(8)}${'Name'.padEnd(16)}${'CPU (s)'.padEnd(12)}${'Memory (MB)'.padEnd(14)}Path`
    );
    outputChannel.appendLine('-'.repeat(90));

    for (const processInfo of processes) {
        const cpu = processInfo.cpu === null ? '-' : processInfo.cpu.toFixed(2);
        const memory = (processInfo.workingSet / 1024 / 1024).toFixed(1);
        outputChannel.appendLine(
            `${String(processInfo.id).padEnd(8)}${processInfo.name.padEnd(16)}${cpu.padEnd(12)}${memory.padEnd(14)}${processInfo.path ?? '-'}`
        );
    }
}

function ensureWindows(): void {
    if (process.platform !== 'win32') {
        throw new Error('.NET Host process management is currently supported only on Windows.');
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function showCommandError(action: string, error: unknown): void {
    const message = getErrorMessage(error);
    outputChannel.clear();
    outputChannel.show(true);
    outputChannel.appendLine(`${NET_PULSE}${action}: ${message}`);
    vscode.window.showErrorMessage(`${action}: ${message}`);
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
