package com.diploma.proforientation.util;

public final class Constants {

    public static final String DEFAULT_LOCALE = "en";

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
    public static final String PERCENT = "%";

    public static final String QUIZ_ID = "quizId";
    public static final String QUIZ_STATUS = "quizStatus";
    public static final String CATEGORY_ID = "categoryId";
    public static final String QUIZ_CODE = "quizCode";
    public static final String ATTEMPT_ID = "attemptId";

    public static final String ATTEMPTS_TOTAL = "attemptsTotal";
    public static final String ATTEMPTS_SUBMITTED = "attemptsSubmitted";
    public static final String QUESTIONS_TOTAL = "questionsTotal";

    public static final String ESTIMATED_DURATION_SECONDS = "estimatedDurationSeconds";
    public static final String AVG_DURATION_SECONDS = "avgDurationSeconds";

    public static final String SQL_TEXT_FUNCTION = "text";

    public static final String ENTITY_QUIZZES = "quizzes";
    public static final String ENTITY_QUIZ_VERSIONS = "quiz_versions";
    public static final String ENTITY_QUESTIONS = "questions";
    public static final String ENTITY_QUESTION_OPTIONS = "question_options";
    public static final String ENTITY_PROFESSIONS = "professions";
    public static final String ENTITY_ATTEMPTS = "attempts";
    public static final String ENTITY_TRANSLATIONS = "translations";
    public static final String ENTITY_QUIZ_PUBLIC_METRICS = "quiz_public_metrics";
    public static final String ENTITY_ANALYTICS_OVERVIEW = "quiz_analytics_overview";
    public static final String ENTITY_ANALYTICS_DETAILED = "quiz_analytics_detailed";

    public static final String SHEET_ANALYTICS_FUNNEL = "overview_funnel";
    public static final String SHEET_ANALYTICS_ACTIVITY_DAILY = "overview_activity_daily";
    public static final String SHEET_ANALYTICS_TOP_PROFESSIONS = "overview_top_professions";

    public static final String SHEET_ANALYTICS_AVG_CHOICE = "detailed_avg_choice";
    public static final String SHEET_ANALYTICS_OPTION_DISTRIBUTION = "detailed_option_distribution";
    public static final String SHEET_ANALYTICS_DISCRIMINATION = "detailed_discrimination";

    public static final String[] HEADERS_QUIZ_PUBLIC_METRICS = {
            "quiz_id","quiz_code","quiz_status","category_id",
            "questions_total","attempts_total","attempts_submitted",
            "avg_duration_seconds","estimated_duration_seconds"
    };

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

    public static final String[] HEADERS_ANALYTICS_FUNNEL = {
            "quiz_id","quiz_version_id","attempts_started","attempts_completed","completion_rate","avg_duration_seconds"
    };

    public static final String[] HEADERS_ANALYTICS_ACTIVITY_DAILY = {
            "day","attempts_started","attempts_completed","avg_duration_seconds"
    };

    public static final String[] HEADERS_ANALYTICS_TOP_PROFESSIONS = {
            "profession_id","profession_title","top1_count"
    };

    public static final String[] HEADERS_ANALYTICS_AVG_CHOICE = {
            "question_id","question_ord","avg_choice","answers_count"
    };

    public static final String[] HEADERS_ANALYTICS_OPTION_DISTRIBUTION = {
            "question_id","question_ord","option_id","option_ord","count"
    };

    public static final String[] HEADERS_ANALYTICS_DISCRIMINATION = {
            "question_id","disc_norm","disc_quality","attempts_submitted"
    };

    // EMAIL
    public static final String EMAIL_RESET_SUBJECT = "email.reset.subject";
    public static final String EMAIL_RESET_BODY = "email.reset.body";

    // NOT FOUND
    public static final String PROFESSION_NOT_FOUND = "error.profession.not_found";
    public static final String CATEGORY_NOT_FOUND = "error.category.not_found";
    public static final String QUIZ_NOT_FOUND = "error.quiz.not_found";
    public static final String AUTHOR_NOT_FOUND = "error.author.not_found";
    public static final String USER_NOT_FOUND = "error.user.not_found";
    public static final String QUIZ_VERSION_NOT_FOUND = "error.quiz_version.not_found";
    public static final String CURRENT_QUIZ_VERSION_NOT_FOUND = "error.current_quiz_version.not_found";
    public static final String NO_QUIZ_VERSIONS = "error.no_quiz_versions";
    public static final String QUESTION_NOT_FOUND = "error.question.not_found";
    public static final String OPTION_NOT_FOUND = "error.option.not_found";
    public static final String OPTIONS_NOT_FOUND = "error.options.not_found";
    public static final String TRAIT_NOT_FOUND = "error.trait.not_found";
    public static final String ATTEMPT_NOT_FOUND = "error.attempt.not_found";
    public static final String ATTEMPT_SUBMITTED = "error.attempt.submitted";
    public static final String TRANSLATION_NOT_FOUND = "error.translation.not_found";
    public static final String QUIZ_METRICS_NOT_FOUND = "error.quiz_metrics.not_found";
    public static final String QUIZ_CODE_NOT_FOUND = "error.quiz_code.not_found";

    // VALIDATION / BUSINESS
    public static final String INVALID_INT = "error.invalid_int";
    public static final String INVALID_ENUM_VALUE = "error.invalid_enum_value";
    public static final String UNSUPPORTED_ENTITY = "error.unsupported_entity";
    public static final String EMPTY_REQUIRED_FIELDS = "error.empty_required_fields";
    public static final String MISSING_COLUMN = "error.missing_column";
    public static final String MISSING_REQUIRED_COLUMN = "error.missing_required_column";
    public static final String NOT_INTEGER = "error.not_integer";
    public static final String UNSUPPORTED_EXPORT_ENTITY = "error.unsupported_export_entity";
    public static final String CSV_EXPORT_FAILED = "error.csv_export_failed";
    public static final String EXCEL_EXPORT_FAILED = "error.excel_export_failed";
    public static final String SECONDS_GT_ZERO = "error.seconds_gt_zero";
    public static final String CANNOT_CHANGE_OWN_ROLE = "error.cannot_change_own_role";
    public static final String DELETE_ATTEMPT_CONFIRMATION = "error.delete_attempt_confirmation";

    // AUTH
    public static final String INVALID_CREDENTIALS = "error.invalid_credentials";
    public static final String INVALID_PASSWORD = "error.invalid_password";
    public static final String UNKNOWN_USER = "error.unknown_user";
    public static final String UNKNOWN_OPTIONS = "error.unknown_options";

    // LLM / ML / TECH
    public static final String INVALID_JSON_FROM_LLM = "error.invalid_json_from_llm";
    public static final String INVALID_PROMPT = "error.invalid_prompt";
    public static final String RIASEC_INVALID_ANSWER_COUNT =
            "error.riasec.invalid_answer_count";

    // COMMON
    public static final String MESSAGE_REQUIRED = "error.message_required";
    public static final String UTILITY_CLASS = "error.utility_class";

    public static final String CSV_IMPORT_FAILED = "error.csv_import_failed";
    public static final String EMAIL_ALREADY_EXISTS = "error.email_already_exists";
    public static final String EMAIL_NOT_FOUND = "error.email_not_found";
    public static final String PASSWORD_RESET_TOKEN_EXPIRED = "error.password_reset_token_expired";
    public static final String GOOGLE_TOKEN_VERIFICATION_FAILED = "error.google_token_verification_failed";
    public static final String INVALID_GOOGLE_ID_TOKEN = "error.invalid_google_id_token";
    public static final String INVALID_PASSWORD_RESET_TOKEN = "error.invalid_password_reset_token";
    public static final String LLM_PARSING_FAILED = "error.llm_parsing_failed";
    public static final String LLM_PROMPT_FAILED = "error.llm_prompt_failed";
    public static final String USER_NOT_FOUND_FOR_PASSWORD_RESET = "error.user_not_found_for_password_reset";

    public static final String ERROR_MALFORMED_JSON = "error.malformed_json";
    public static final String ERROR_MISSING_PARAMETER = "error.missing_parameter";
    public static final String ERROR_MISSING_HEADER = "error.missing_header";
    public static final String ERROR_MISSING_MULTIPART_PART = "error.missing_multipart_part";
    public static final String ERROR_INVALID_PARAMETER_VALUE = "error.invalid_parameter_value";
    public static final String ERROR_UNAUTHORIZED = "error.unauthorized";
    public static final String ERROR_ACCESS_DENIED = "error.access_denied";
    public static final String ERROR_ENTITY_NOT_FOUND = "error.entity_not_found";
    public static final String ERROR_ENDPOINT_NOT_FOUND = "error.endpoint_not_found";
    public static final String ERROR_METHOD_NOT_ALLOWED = "error.method_not_allowed";
    public static final String ERROR_DATA_INTEGRITY = "error.data_integrity";
    public static final String ERROR_IO = "error.io";
    public static final String ERROR_UNEXPECTED = "error.unexpected";

    private Constants() {}
}