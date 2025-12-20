export async function orvalFetch<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api${url}`, {
        ...init,
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error(`API error ${res.status}`);
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
}
