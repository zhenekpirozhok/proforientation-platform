function hasStringMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

export async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = hasStringMessage(data)
      ? data.message
      : typeof data === 'string'
        ? data
        : res.statusText || 'Request failed';

    throw new Error(message);
  }

  return data as T;
}
