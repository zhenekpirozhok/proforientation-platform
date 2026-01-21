export type TranslationStatus = 'ok' | 'missing' | 'partial';

export type QuizTranslatableRow = {
    id: number;
    title: string;
    subtitle?: string;
    ru: TranslationStatus;
    en: TranslationStatus;
    href: string;
};

export type LocaleKey = 'ru' | 'en';

export type EntityType =
    | 'quiz'
    | 'question'
    | 'question_option'
    | 'profession'
    | 'trait'
    | 'profession_category';

export type FieldKey = 'title' | 'text' | 'description';

export type EntityConfig = {
    entityType: EntityType;
    fields: Array<{
        key: FieldKey;
        labelKey: string;
        placeholderKey: string;
        input: 'input' | 'textarea';
        required?: boolean;
    }>;
};
