export function downloadJson(filename: string, payload: unknown): void {
  downloadBlob(filename, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

export function downloadBlob(filename: string, body: string, contentType: string): void {
  const blob = new Blob([body], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
