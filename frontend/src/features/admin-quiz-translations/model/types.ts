export type TranslationStatus = 'ok' | 'missing' | 'partial';

export type QuizTranslatableRow = {
    id: number;
    title: string;
    subtitle?: string;
    href: string;
};

export type LocaleKey = 'ru' | 'en';

export type EntityType =
    | 'quiz'
    | 'question'
    | 'question_option'
    | 'profession'
    | 'trait_profile';

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
