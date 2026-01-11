import { customAlphabet } from 'nanoid';

const charMap: Record<string, string> = {
    А: 'A', а: 'a', Б: 'B', б: 'b', В: 'V', в: 'v', Г: 'G', г: 'g', Д: 'D', д: 'd',
    Е: 'E', е: 'e', Ё: 'E', ё: 'e', Ж: 'Zh', ж: 'zh', З: 'Z', з: 'z', И: 'I', и: 'i',
    Й: 'I', й: 'i', К: 'K', к: 'k', Л: 'L', л: 'l', М: 'M', м: 'm', Н: 'N', н: 'n',
    О: 'O', о: 'o', П: 'P', п: 'p', Р: 'R', р: 'r', С: 'S', с: 's', Т: 'T', т: 't',
    У: 'U', у: 'u', Ф: 'F', ф: 'f', Х: 'Kh', х: 'kh', Ц: 'Ts', ц: 'ts', Ч: 'Ch', ч: 'ch',
    Ш: 'Sh', ш: 'sh', Щ: 'Shch', щ: 'shch', Ы: 'Y', ы: 'y', Э: 'E', э: 'e', Ю: 'Yu', ю: 'yu',
    Я: 'Ya', я: 'ya', Ь: '', ь: '', Ъ: '', ъ: '',
};

function transliterate(str: string): string {
    return str.split('').map((c) => charMap[c] ?? c).join('');
}

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

type GenerateEntityCodeOptions = {
    fallback?: string;
    maxBaseLen?: number;
    suffixLen?: number;
    withTime?: boolean;
};

export function generateEntityCode(input: string, opts: GenerateEntityCodeOptions = {}) {
    const fallback = opts.fallback ?? 'entity';
    const maxBaseLen = opts.maxBaseLen ?? 40;
    const suffixLen = opts.suffixLen ?? 8;
    const withTime = opts.withTime ?? true;

    const baseRaw = transliterate(input)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\d]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();

    const base = (baseRaw || fallback).slice(0, maxBaseLen);

    const time = withTime ? `_${Date.now().toString(36)}` : '';
    const suffix = nanoid().slice(0, suffixLen);

    return `${base}${time}_${suffix}`;
}
