export function withLocale(locale: string | undefined, path: string) {
    const safeLocale = locale === "ru" || locale === "en" ? locale : "en";
    const p = path.startsWith("/") ? path : `/${path}`;
    return `/${safeLocale}${p}`;
}
