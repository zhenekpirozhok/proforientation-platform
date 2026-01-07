export async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (!text) return res.statusText || 'Request failed';

  try {
    const json: unknown = JSON.parse(text);

    if (
      typeof json === 'object' &&
      json !== null &&
      'message' in json &&
      typeof (json as { message?: unknown }).message === 'string'
    ) {
      return (json as { message: string }).message;
    }

    return text;
  } catch {
    return text;
  }
}
