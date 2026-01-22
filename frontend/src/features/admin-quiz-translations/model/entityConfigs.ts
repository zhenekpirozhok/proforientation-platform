import type { EntityConfig } from './types';

export const QUIZ_TRANSLATIONS_CONFIG: EntityConfig = {
  entityType: 'quiz',
  fields: [
    {
      key: 'title',
      labelKey: 'titleLabel',
      placeholderKey: 'placeholderTitle',
      input: 'input',
      required: true,
    },
    {
      key: 'description',
      labelKey: 'descriptionLabel',
      placeholderKey: 'placeholderDescription',
      input: 'textarea',
    },
  ],
};

export const QUESTION_TRANSLATIONS_CONFIG: EntityConfig = {
  entityType: 'question',
  fields: [
    {
      key: 'text',
      labelKey: 'textLabel',
      placeholderKey: 'placeholderText',
      input: 'textarea',
      required: true,
    },
  ],
};

export const OPTION_TRANSLATIONS_CONFIG: EntityConfig = {
  entityType: 'question_option',
  fields: [
    {
      key: 'text',
      labelKey: 'textLabel',
      placeholderKey: 'placeholderText',
      input: 'input',
      required: true,
    },
  ],
};

export const PROFESSION_TRANSLATIONS_CONFIG: EntityConfig = {
  entityType: 'profession',
  fields: [
    {
      key: 'title',
      labelKey: 'titleLabel',
      placeholderKey: 'placeholderTitle',
      input: 'input',
      required: true,
    },
    {
      key: 'description',
      labelKey: 'descriptionLabel',
      placeholderKey: 'placeholderDescription',
      input: 'textarea',
    },
  ],
};

export const TRAIT_TRANSLATIONS_CONFIG: EntityConfig = {
  entityType: 'trait',
  fields: [
    {
      key: 'title',
      labelKey: 'titleLabel',
      placeholderKey: 'placeholderTitle',
      input: 'input',
      required: true,
    },
    {
      key: 'description',
      labelKey: 'descriptionLabel',
      placeholderKey: 'placeholderDescription',
      input: 'textarea',
    },
  ],
};

export const CATEGORY_TRANSLATIONS_CONFIG: EntityConfig = {
  entityType: 'profession_category',
  fields: [
    {
      key: 'title',
      labelKey: 'titleLabel',
      placeholderKey: 'placeholderTitle',
      input: 'input',
      required: true,
    },
  ],
};
