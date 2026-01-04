export async function readErrorMessage(res: Response) {
    const text = await res.text().catch(() => '');
    if (!text) return res.statusText || 'Request failed';

    try {
        const json = JSON.parse(text) as any;
        const msg = typeof json?.message === 'string' ? json.message : null;
        return msg ?? text;
    } catch {
        return text;
    }
}
