export function sanitizeFilenamePart(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function downloadJson<T>(data: T, fileName: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], {type: 'application/json'});
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    requestAnimationFrame(() => window.URL.revokeObjectURL(url));
}
