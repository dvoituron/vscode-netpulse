import * as fs from 'fs';
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { NET_PULSE } from '../constants';

/**
 * Cross-platform sound player for short audio cues (e.g. build success/failure).
 * Playback is fire-and-forget and fails silently if the file is missing or no
 * suitable player is available on the host system.
 */
export class SoundPlayer {
    /**
     * Plays an audio file asynchronously.
     * Supports Windows (PowerShell SoundPlayer, .wav), macOS (afplay) and Linux
     * (paplay / aplay / ffplay, whichever is found first).
     * @param soundPath - Absolute path to the sound file. Empty/whitespace disables playback.
     * @param channel - The output channel for logging playback attempts.
     */
    public static play(soundPath: string, channel: vscode.OutputChannel): void {
        if (!soundPath || !soundPath.trim()) {
            return;
        }
        if (!fs.existsSync(soundPath)) {
            return;
        }

        switch (process.platform) {
            case 'win32':
                SoundPlayer.playWindows(soundPath, channel);
                break;
            case 'darwin':
                SoundPlayer.spawnDetached('afplay', [soundPath]);
                break;
            case 'linux':
                SoundPlayer.playLinux(soundPath, channel);
                break;
            default:
                // Unsupported platform — silently ignore.
                break;
        }
    }

    private static playWindows(soundPath: string, channel: vscode.OutputChannel): void {
        channel.appendLine(`${NET_PULSE}Play the sound ${soundPath}`);
        const escaped = soundPath.replace(/"/g, '`"');
        // Use [System.Media.SoundPlayer] explicitly and Load() before PlaySync()
        // for maximum reliability across Windows PowerShell 5.1 and PowerShell 7+.
        const psCommand =
            `$ErrorActionPreference='Stop';` +
            `$p = New-Object System.Media.SoundPlayer("${escaped}");` +
            `$p.Load();` +
            `$p.PlaySync();`;
        try {
            const child = spawn(
                'powershell.exe',
                ['-NoProfile', '-NonInteractive', '-Command', psCommand],
                { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true }
            );
            let stderr = '';
            child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
            child.on('error', (err) => {
                channel.appendLine(`${NET_PULSE}Sound playback failed to start: ${err.message}`);
            });
            child.on('exit', (code) => {
                if (code !== 0) {
                    channel.appendLine(`${NET_PULSE}Sound playback exited with code ${code}.${stderr ? ' ' + stderr.trim() : ''}`);
                }
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            channel.appendLine(`${NET_PULSE}Sound playback failed: ${msg}`);
        }
    }

    private static playLinux(soundPath: string, channel: vscode.OutputChannel): void {
        // Try common players in order; first one that exists on PATH wins.
        // We rely on spawn() emitting 'error' when the binary isn't found and fall through.
        channel.appendLine(`${NET_PULSE}Play the sound ${soundPath}`);
        const candidates = ['paplay', 'aplay', 'ffplay'];
        SoundPlayer.tryLinuxPlayers(candidates, 0, soundPath, channel);
    }

    private static tryLinuxPlayers(candidates: string[], index: number, soundPath: string, channel: vscode.OutputChannel): void {
        if (index >= candidates.length) {
            return;
        }
        const player = candidates[index];
        channel.appendLine(`${NET_PULSE}Play the sound ${soundPath} with ${player}`);
        const args = player === 'ffplay'
            ? ['-nodisp', '-autoexit', '-loglevel', 'quiet', soundPath]
            : [soundPath];
        try {
            const child = spawn(player, args, { detached: true, stdio: 'ignore' });
            child.on('error', () => {
                SoundPlayer.tryLinuxPlayers(candidates, index + 1, soundPath, channel);
            });
            child.unref();
        } catch {
            SoundPlayer.tryLinuxPlayers(candidates, index + 1, soundPath, channel);
        }
    }

    private static spawnDetached(command: string, args: string[], extraOptions: { windowsHide?: boolean } = {}): void {
        try {
            const child = spawn(command, args, {
                detached: true,
                stdio: 'ignore',
                windowsHide: extraOptions.windowsHide ?? false
            });
            child.on('error', () => { /* ignore */ });
            child.unref();
        } catch {
            // ignore
        }
    }
}
