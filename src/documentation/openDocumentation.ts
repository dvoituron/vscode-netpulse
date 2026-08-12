import * as vscode from 'vscode';
import { NET_PULSE } from '../constants';
import { DotnetPulseSettings, DocumentationItem } from '../settings';

/**
 * Checks if there are any documentation URLs configured
 * @returns True if documentation URLs are configured, false otherwise
 */
export function hasDocumentationUrls(): boolean {
    const urls = DotnetPulseSettings.documentationUrls();
    return urls.length > 0;
}

/**
 * Opens a documentation URL selected by the user
 */
export async function openDocumentation(): Promise<void> {
    const urls = DotnetPulseSettings.documentationUrls();

    if (urls.length === 0) {
        vscode.window.showInformationMessage(
            `${NET_PULSE}No documentation URLs configured. Add them in settings (dotnetPulse.documentationUrls).`
        );
        return;
    }

    // Create quick pick items from the documentation URLs
    const quickPickItems: vscode.QuickPickItem[] = urls.map((item) => ({
        label: item.label,
        description: item.url,
    }));

    // Show the quick pick to let user select a document
    const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Select a document to open',
        title: 'Open Documentation',
    });

    if (!selected) {
        return; // User cancelled
    }

    // Find the corresponding URL
    const selectedItem = urls.find((item) => item.label === selected.label);
    if (selectedItem) {
        // Open the URL in the default browser
        vscode.env.openExternal(vscode.Uri.parse(selectedItem.url));
    }
}
