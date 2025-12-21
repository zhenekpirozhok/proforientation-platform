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
        const message =
            (typeof data === "object" &&
                data !== null &&
                "message" in data &&
                typeof (data as any).message === "string"
                ? (data as any).message
                : typeof data === "string"
                    ? data
                    : res.statusText) || "Request failed";

        throw new Error(message);
    }

    return data as T;
}
