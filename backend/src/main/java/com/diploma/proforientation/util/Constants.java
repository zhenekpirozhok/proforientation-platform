package com.diploma.proforientation.util;

public final class Constants {

    public static final String DEFAULT_LOCALE = "en";

    public static final String PROFESSION_NOT_FOUND = "Profession not found";
    public static final String CATEGORY_NOT_FOUND = "Category not found";
    public static final String QUIZ_NOT_FOUND = "Quiz not found";
    public static final String AUTHOR_NOT_FOUND = "Author not found";
    public static final String USER_NOT_FOUND = "User not found";
    public static final String QUIZ_VERSION_NOT_FOUND = "Quiz version not found";
    public static final String CURRENT_QUIZ_VERSION_NOT_FOUND = "Current version not found";
    public static final String NO_QUIZ_VERSIONS = "No versions to copy";
    public static final String QUESTION_NOT_FOUND = "Question not found";
    public static final String OPTION_NOT_FOUND = "Option not found";
    public static final String OPTIONS_NOT_FOUND = "Some options not found";
    public static final String TRAIT_NOT_FOUND = "Trait not found";
    public static final String ATTEMPT_NOT_FOUND = "Attempt not found";
    public static final String ATTEMPT_SUBMITTED = "Attempt already submitted";
    public static final String TRANSLATION_NOT_FOUND = "Translation not found";
    public static final String QUIZ_METRICS_NOT_FOUND = "Quiz metrics not found";
    public static final String QUIZ_CODE_NOT_FOUND = "Quiz not found with code: ";

    public static final String CSV_IMPORT_FAILED = "CSV import failed";
    public static final String TRANSLATION_CSV_IMPORT_FAILED = "Translation CSV import failed";
    public static final String INVALID_CSV = "Invalid CSV format: ";
    public static final String NO_HEADER_IN_CSV = "CSV file has no header row";
    public static final String EMPTY_CSV = "CSV file is empty";
    public static final String INVALID_INT = "Invalid integer";
    public static final String INVALID_ENUM_VALUE = "Invalid enum value";
    public static final String UNSUPPORTED_ENTITY = "Unsupported entity type";
    public static final String EMPTY_REQUIRED_FIELDS = "Required fields are empty";
    public static final String MISSING_COLUMN = "Missing column";
    public static final String MISSING_REQUIRED_COLUMN = "Missing required column: ";
    public static final String NOT_INTEGER = "Must be integer";
    public static final String UNSUPPORTED_EXPORT_ENTITY = "Unsupported export entity: ";
    public static final String CSV_EXPORT_FAILED = "CSV export failed for ";
    public static final String EXCEL_EXPORT_FAILED = "Excel export failed";
    public static final String DB_CONSTRAINT_VIOLATION = "Database constraint violation";
    public static final String SECONDS_COUNT_SHOULD_BE_GRATER_THEN_ZERO = "secondsPerQuestionDefault must be > 0";
    public static final String CANNOT_CHANGE_OWN_ROLE = "Cannot change your own role";

    public static final String INVALID_CRED = "Invalid email or password";
    public static final String INVALID_PASS = "Password verification failed";
    public static final String UNKNOWN_USER = "Unknown user";
    public static final String UNKNOWN_OPTIONS = "Some options do not belong to questionId=";

    public static final String INVALID_JSON_FROM_LLM = "LLM returned invalid JSON: ";
    public static final String INVALID_PROMPT = "Failed to build prompt JSON";

    public static final String ENTITY_TYPE_QUESTION = "question";
    public static final String ENTITY_TYPE_QUIZ = "quiz";
    public static final String ENTITY_TYPE_OPTION = "question_option";
    public static final String ENTITY_TYPE_PROF = "profession";
    public static final String ENTITY_TYPE_CATEGORY = "profession_category";
    public static final String ENTITY_TYPE_TRAIT= "trait";

    public static final String FIELD_TEXT = "text";
    public static final String FIELD_DESCRIPTION = "description";
    public static final String FIELD_TITLE = "title";

    public static final String FIELD_ROW = "row";
    public static final String FIELD_ORD = "ord";
    public static final String FIELD_QUIZ_VERSION_ID = "quiz_version_id";
    public static final String FIELD_QTYPE = "qtype";
    public static final String FIELD_TEXT_DEFAULT = "text_default";
    public static final String FIELD_ENTITY_TYPE = "entity_type";

    public static final String COL_ENTITY_TYPE = "entity_type";
    public static final String COL_ENTITY_ID = "entity_id";
    public static final String COL_FIELD = "field";
    public static final String COL_LOCALE = "locale";
    public static final String COL_TEXT = "text";

    public static final String EMPTY_STRING = "";

    public static final String MESSAGE_REQUIRED = "Required";
    public static final String MESSAGE_MISSING = "Missing value";

    public static final String ENTITY_QUIZZES = "quizzes";
    public static final String ENTITY_QUIZ_VERSIONS = "quiz_versions";
    public static final String ENTITY_QUESTIONS = "questions";
    public static final String ENTITY_QUESTION_OPTIONS = "question_options";
    public static final String ENTITY_PROFESSIONS = "professions";
    public static final String ENTITY_ATTEMPTS = "attempts";
    public static final String ENTITY_TRANSLATIONS = "translations";

    public static final String[] HEADERS_QUIZZES = {
            "id", "code", "title_default", "description_default",
            "status", "processing_mode", "category_id",
            "author_id", "seconds_per_question"
    };

    public static final String[] HEADERS_QUIZ_VERSIONS = {
            "id", "quiz_id", "version", "current", "published_at"
    };

    public static final String[] HEADERS_QUESTIONS = {
            "id", "quiz_version_id", "ord", "qtype", "text_default"
    };

    public static final String[] HEADERS_QUESTION_OPTIONS = {
            "id", "question_id", "ord", "label_default"
    };

    public static final String[] HEADERS_PROFESSIONS = {
            "id", "code", "title_default", "description", "ml_class_code", "category_id"
    };

    public static final String[] HEADERS_ATTEMPTS = {
            "id", "quiz_version_id", "user_id", "guest_token",
            "locale", "started_at", "submitted_at", "uuid"
    };

    public static final String[] HEADERS_TRANSLATIONS = {
            "id", "entity_type", "entity_id", "locale", "field", "text"
    };

    private Constants() {}
}