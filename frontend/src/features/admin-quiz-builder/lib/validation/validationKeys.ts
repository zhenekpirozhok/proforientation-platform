'use client';

export function parseScaleKey(key: string) {
    const m = /^scale\.([^\.]+)\.(name|code|description)$/.exec(key);
    if (!m) return null;
    return { tempId: m[1], field: m[2] as 'name' | 'code' | 'description' };
}

export function parsePairKey(key: string) {
    const m = /^pair\.([^\.]+)$/.exec(key);
    if (!m) return null;
    return { pairId: m[1] };
}

export function parseQuestionKey(key: string) {
    const m = /^q\.([^\.]+)\.(text|qtype|options|traits)$/.exec(key);
    if (!m) return null;
    return {
        tempId: m[1],
        field: m[2] as 'text' | 'qtype' | 'options' | 'traits',
    };
}

export function parseOptionKey(key: string) {
    const m = /^o\.([^\.]+)\.(label|weights)$/.exec(key);
    if (!m) return null;
    return { tempId: m[1], field: m[2] as 'label' | 'weights' };
}
