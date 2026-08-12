/**
 * Supported file extensions for code-behind navigation
 */
export const SUPPORTED_EXTENSIONS = ['.cshtml', '.razor', '.aspx', '.ascx'];

/**
 * Get the file extension from a URI path
 */
export function getExtension(uriPath: string): string {
    const lastDotIndex = uriPath.lastIndexOf('.');
    return lastDotIndex >= 0 ? uriPath.substring(lastDotIndex).toLowerCase() : '';
}

/**
 * Get the base name from a URI path
 */
export function getBaseName(uriPath: string): string {
    const lastSlashIndex = Math.max(uriPath.lastIndexOf('/'), uriPath.lastIndexOf('\\'));
    return lastSlashIndex >= 0 ? uriPath.substring(lastSlashIndex + 1) : uriPath;
}
