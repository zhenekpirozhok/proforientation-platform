package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.importexport.ImportErrorDto;
import com.diploma.proforientation.dto.importexport.ImportResultDto;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.ImportService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;

import static com.diploma.proforientation.util.Constants.*;

@Service("excelImportService")
@RequiredArgsConstructor
public class ExcelImportServiceImpl implements ImportService {

    private final TranslationRepository translationRepo;
    private final QuizRepository quizRepo;
    private final ProfessionRepository professionRepo;
    private final ProfessionCategoryRepository categoryRepo;
    private final UserRepository userRepo;
    private final QuizVersionRepository quizVersionRepo;
    private final QuestionRepository questionRepo;

    private final DataFormatter fmt = new DataFormatter();

    private static final String COL_CODE = "code";
    private static final String COL_TITLE_DEFAULT = "title_default";
    private static final String COL_CATEGORY_ID = "category_id";
    private static final String COL_AUTHOR_ID = "author_id";
    private static final String COL_STATUS = "status";
    private static final String COL_PROCESSING_MODE = "processing_mode";
    private static final String COL_DESCRIPTION_DEFAULT = "description_default";
    private static final String COL_SECONDS_PER_QUESTION_DEFAULT = "seconds_per_question_default";
    private static final String COL_DESCRIPTION = "description";
    private static final String COL_ML_CLASS_CODE = "ml_class_code";

    @Override
    @Transactional
    public ImportResultDto importTranslations(MultipartFile file) {
        validateFile(file);

        List<ImportErrorDto> errors = new ArrayList<>();
        List<Translation> valid = new ArrayList<>();
        int total = 0;

        try (InputStream is = file.getInputStream(); Workbook wb = WorkbookFactory.create(is)) {
            SheetContext ctx = prepareSheetContext(
                    wb,
                    errors,
                    List.of(COL_ENTITY_TYPE, COL_ENTITY_ID, COL_FIELD, COL_LOCALE, COL_TEXT)
            );

            ImportResultDto headerFailure = failIfHeaderInvalid(errors);
            if (headerFailure != null) {
                return headerFailure;
            }

            Sheet sheet = ctx.sheet();
            Map<String, Integer> idx = ctx.idx();

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row != null && hasData(row)) {
                    total++;
                    int rowNum = r + 1;

                    RowParseResult<Translation> parsed = parseTranslationRow(row, idx, rowNum);
                    if (parsed.hasErrors()) {
                        errors.addAll(parsed.errors());
                    } else {
                        valid.add(parsed.value());
                    }
                }
            }

            translationRepo.saveAll(valid);

            return new ImportResultDto(total, valid.size(), errors);
        } catch (Exception e) {
            throw new IllegalStateException(ERROR_EXCEL_TRANSLATIONS_IMPORT_FAILED + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ImportResultDto importQuizzes(MultipartFile file) {
        validateFile(file);

        List<ImportErrorDto> errors = new ArrayList<>();
        List<Quiz> valid = new ArrayList<>();
        int total = 0;

        try (InputStream is = file.getInputStream(); Workbook wb = WorkbookFactory.create(is)) {
            SheetContext ctx = prepareSheetContext(
                    wb,
                    errors,
                    List.of(COL_CODE, COL_TITLE_DEFAULT, COL_CATEGORY_ID, COL_AUTHOR_ID)
            );

            ImportResultDto headerFailure = failIfHeaderInvalid(errors);
            if (headerFailure != null) {
                return headerFailure;
            }

            Sheet sheet = ctx.sheet();
            Map<String, Integer> idx = ctx.idx();

            Set<String> codesInFile = new HashSet<>();

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row != null && hasData(row)) {
                    total++;
                    int rowNum = r + 1;

                    RowParseResult<Quiz> parsed = parseQuizRow(row, idx, rowNum, codesInFile);
                    if (parsed.hasErrors()) {
                        errors.addAll(parsed.errors());
                    } else {
                        valid.add(parsed.value());
                    }
                }
            }

            quizRepo.saveAll(valid);

            Instant now = Instant.now();
            for (Quiz q : valid) {
                if (q.getStatus() == QuizStatus.PUBLISHED) {
                    ensurePublishedVersionExists(q, now);
                }
            }

            return new ImportResultDto(total, valid.size(), errors);
        } catch (Exception e) {
            throw new IllegalStateException(ERROR_EXCEL_QUIZZES_IMPORT_FAILED + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ImportResultDto importProfessions(MultipartFile file) {
        validateFile(file);

        List<ImportErrorDto> errors = new ArrayList<>();
        List<Profession> valid = new ArrayList<>();
        int total = 0;

        try (InputStream is = file.getInputStream(); Workbook wb = WorkbookFactory.create(is)) {
            Sheet sheet = wb.getSheetAt(0);
            Map<String, Integer> idx = headerIndex(sheet, errors);

            requireColumns(idx, errors,  List.of(
                    COL_CODE, COL_TITLE_DEFAULT, COL_CATEGORY_ID
            ));
            if (!errors.isEmpty()) {
                return new ImportResultDto(0, 0, errors);
            }

            Set<String> codesInFile = new HashSet<>();

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row != null && hasData(row)) {
                    total++;
                    int rowNum = r + 1;

                    RowParseResult<Profession> parsed = parseProfessionRow(row, idx, rowNum, codesInFile);
                    if (parsed.hasErrors()) {
                        errors.addAll(parsed.errors());
                    } else {
                        valid.add(parsed.value());
                    }
                }
            }

            professionRepo.saveAll(valid);

            return new ImportResultDto(total, valid.size(), errors);
        } catch (Exception e) {
            throw new IllegalStateException(ERROR_EXCEL_PROFESSIONS_IMPORT_FAILED + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ImportResultDto importQuestions(MultipartFile file) {
        validateFile(file);

        List<ImportErrorDto> errors = new ArrayList<>();
        List<Question> valid = new ArrayList<>();
        int total = 0;

        try (InputStream is = file.getInputStream(); Workbook wb = WorkbookFactory.create(is)) {
            Sheet sheet = wb.getSheetAt(0);
            Map<String, Integer> idx = headerIndex(sheet, errors);

            requireColumns(idx, errors,  List.of(
                    FIELD_QUIZ_VERSION_ID, FIELD_ORD, FIELD_QTYPE, FIELD_TEXT_DEFAULT
            ));
            if (!errors.isEmpty()) {
                return new ImportResultDto(0, 0, errors);
            }

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row != null && hasData(row)) {
                    total++;
                    int rowNum = r + 1;

                    RowParseResult<Question> parsed = parseQuestionRow(row, idx, rowNum);
                    if (parsed.hasErrors()) {
                        errors.addAll(parsed.errors());
                    } else {
                        valid.add(parsed.value());
                    }
                }
            }

            questionRepo.saveAll(valid);

            return new ImportResultDto(total, valid.size(), errors);
        } catch (Exception e) {
            throw new IllegalStateException(ERROR_EXCEL_QUESTIONS_IMPORT_FAILED + e.getMessage(), e);
        }
    }

    private RowParseResult<Translation> parseTranslationRow(Row row, Map<String, Integer> idx, int rowNum) {
        List<ImportErrorDto> rowErrors = new ArrayList<>();

        String entityType = getString(row, idx, COL_ENTITY_TYPE);
        String field = getString(row, idx, COL_FIELD);
        String locale = getString(row, idx, COL_LOCALE);
        String text = getString(row, idx, COL_TEXT);

        Integer entityId = getIntRequired(row, idx, COL_ENTITY_ID, rowNum, rowErrors, NOT_INTEGER);

        if (isBlank(entityType) || isBlank(field) || isBlank(locale)) {
            rowErrors.add(new ImportErrorDto(rowNum, FIELD_ROW, EMPTY_REQUIRED_FIELDS));
        }

        if (!isBlank(entityType) && !Set.of(
                ENTITY_TYPE_QUIZ, ENTITY_TYPE_QUESTION, ENTITY_TYPE_OPTION, ENTITY_TYPE_PROF
        ).contains(entityType)) {
            rowErrors.add(new ImportErrorDto(rowNum, FIELD_ENTITY_TYPE, UNSUPPORTED_ENTITY));
        }

        if (!rowErrors.isEmpty()) {
            return RowParseResult.withErrors(rowErrors);
        }

        Translation tr = translationRepo
                .findByEntityTypeAndEntityIdAndFieldAndLocale(entityType, entityId, field, locale)
                .orElseGet(Translation::new);

        tr.setEntityType(entityType);
        tr.setEntityId(entityId);
        tr.setField(field);
        tr.setLocale(locale);
        tr.setText(text);

        return RowParseResult.ok(tr);
    }

    private RowParseResult<Quiz> parseQuizRow(Row row, Map<String, Integer> idx, int rowNum, Set<String> codesInFile) {
        List<ImportErrorDto> rowErrors = new ArrayList<>();

        String code = getString(row, idx, COL_CODE);
        String title = getString(row, idx, COL_TITLE_DEFAULT);

        Integer categoryId = getIntRequired(row, idx, COL_CATEGORY_ID, rowNum, rowErrors, MESSAGE_REQUIRED);
        Integer authorId = getIntRequired(row, idx, COL_AUTHOR_ID, rowNum, rowErrors, MESSAGE_REQUIRED);

        String statusStr = getString(row, idx, COL_STATUS);
        String modeStr = getString(row, idx, COL_PROCESSING_MODE);
        String descriptionDefault = getString(row, idx, COL_DESCRIPTION_DEFAULT);
        Integer spq = getSecondsPerQuestion(row, idx, rowNum, rowErrors);

        validateRequiredString(rowErrors, rowNum, COL_CODE, code);
        validateRequiredString(rowErrors, rowNum, COL_TITLE_DEFAULT, title);

        validateUniqueCode(rowErrors, rowNum, code, codesInFile);

        QuizStatus status = parseEnum(rowErrors, rowNum, COL_STATUS, statusStr, QuizStatus.class);
        QuizProcessingMode mode = parseEnum(rowErrors, rowNum, COL_PROCESSING_MODE, modeStr, QuizProcessingMode.class);

        if (spq != null && spq <= 0) {
            rowErrors.add(new ImportErrorDto(rowNum, COL_SECONDS_PER_QUESTION_DEFAULT,
                    SECONDS_GT_ZERO));
        }

        ProfessionCategory category = resolveCategory(rowErrors, rowNum, categoryId);
        User author = resolveAuthor(rowErrors, rowNum, authorId);

        if (!rowErrors.isEmpty()) {
            return RowParseResult.withErrors(rowErrors);
        }

        Quiz q = quizRepo.findByCode(code).orElseGet(Quiz::new);
        boolean isNew = q.getId() == null;

        q.setCode(code);
        q.setTitleDefault(title);
        q.setCategory(category);
        q.setAuthor(author);

        q.setStatus(resolveStatus(status, q));
        q.setProcessingMode(resolveMode(mode, q));

        if (!isBlank(descriptionDefault)) {
            q.setDescriptionDefault(descriptionDefault);
        }
        if (spq != null) {
            q.setSecondsPerQuestionDefault(spq);
        }

        Instant now = Instant.now();
        q.setUpdatedAt(now);
        if (isNew && q.getCreatedAt() == null) {
            q.setCreatedAt(now);
        }

        return RowParseResult.ok(q);
    }

    private void validateRequiredString(List<ImportErrorDto> rowErrors, int rowNum, String col, String value) {
        if (isBlank(value)) {
            rowErrors.add(new ImportErrorDto(rowNum, col, MESSAGE_REQUIRED));
        }
    }

    private void validateUniqueCode(List<ImportErrorDto> rowErrors, int rowNum, String code, Set<String> codesInFile) {
        if (!isBlank(code)) {
            String key = code.trim().toLowerCase();
            if (!codesInFile.add(key)) {
                rowErrors.add(new ImportErrorDto(rowNum, COL_CODE, ERROR_EXCEL_DUPLICATE_CODE));
            }
        }
    }

    private ProfessionCategory resolveCategory(List<ImportErrorDto> rowErrors, int rowNum, Integer categoryId) {
        if (categoryId == null) return null;
        ProfessionCategory category = categoryRepo.findById(categoryId).orElse(null);
        if (category == null) {
            rowErrors.add(new ImportErrorDto(rowNum, COL_CATEGORY_ID, CATEGORY_NOT_FOUND));
        }
        return category;
    }

    private User resolveAuthor(List<ImportErrorDto> rowErrors, int rowNum, Integer authorId) {
        if (authorId == null) return null;
        User author = userRepo.findById(authorId).orElse(null);
        if (author == null) {
            rowErrors.add(new ImportErrorDto(rowNum, COL_AUTHOR_ID, AUTHOR_NOT_FOUND));
        }
        return author;
    }

    private QuizStatus resolveStatus(QuizStatus incoming, Quiz existing) {
        if (incoming != null) return incoming;
        if (existing.getStatus() != null) return existing.getStatus();
        return QuizStatus.DRAFT;
    }

    private QuizProcessingMode resolveMode(QuizProcessingMode incoming, Quiz existing) {
        if (incoming != null) return incoming;
        if (existing.getProcessingMode() != null) return existing.getProcessingMode();
        return QuizProcessingMode.LLM;
    }

    private RowParseResult<Question> parseQuestionRow(Row row, Map<String, Integer> idx, int rowNum) {
        List<ImportErrorDto> rowErrors = new ArrayList<>();

        Integer quizVersionId = getIntRequired(row, idx, FIELD_QUIZ_VERSION_ID, rowNum, rowErrors, MESSAGE_REQUIRED);
        Integer ord = getIntRequired(row, idx, FIELD_ORD, rowNum, rowErrors, MESSAGE_REQUIRED);

        String qtypeStr = getString(row, idx, FIELD_QTYPE);
        String text = getString(row, idx, FIELD_TEXT_DEFAULT);

        if (isBlank(qtypeStr)) rowErrors.add(new ImportErrorDto(rowNum, FIELD_QTYPE, MESSAGE_REQUIRED));
        if (isBlank(text)) rowErrors.add(new ImportErrorDto(rowNum, FIELD_TEXT_DEFAULT, MESSAGE_REQUIRED));

        QuizVersion qv = null;
        if (quizVersionId != null) {
            qv = quizVersionRepo.findById(quizVersionId).orElse(null);
            if (qv == null) {
                rowErrors.add(new ImportErrorDto(rowNum, FIELD_QUIZ_VERSION_ID, QUIZ_VERSION_NOT_FOUND));
            }
        }

        QuestionType qtype = parseEnum(rowErrors, rowNum, FIELD_QTYPE, qtypeStr, QuestionType.class);

        if (!rowErrors.isEmpty()) {
            return RowParseResult.withErrors(rowErrors);
        }

        Question q = new Question();
        q.setQuizVersion(qv);
        q.setOrd(ord);
        q.setQtype(qtype);
        q.setTextDefault(text);

        return RowParseResult.ok(q);
    }

    private RowParseResult<Profession> parseProfessionRow(Row row, Map<String, Integer> idx, int rowNum, Set<String> codesInFile) {
        List<ImportErrorDto> rowErrors = new ArrayList<>();

        String code = getString(row, idx, COL_CODE);
        String title = getString(row, idx, COL_TITLE_DEFAULT);
        Integer categoryId = getIntRequired(row, idx, COL_CATEGORY_ID, rowNum, rowErrors, MESSAGE_REQUIRED);

        String description = getString(row, idx, COL_DESCRIPTION);
        String mlClassCode = getString(row, idx, COL_ML_CLASS_CODE);

        validateRequiredString(rowErrors, rowNum, COL_CODE, code);
        validateRequiredString(rowErrors, rowNum, COL_TITLE_DEFAULT, title);
        validateUniqueCode(rowErrors, rowNum, code, codesInFile);

        ProfessionCategory category = resolveCategory(rowErrors, rowNum, categoryId);

        if (!rowErrors.isEmpty()) {
            return RowParseResult.withErrors(rowErrors);
        }

        Profession p = professionRepo.findByCode(code).orElseGet(Profession::new);
        p.setCode(code);
        p.setTitleDefault(title);
        p.setDescription(isBlank(description) ? null : description);
        p.setMlClassCode(isBlank(mlClassCode) ? null : mlClassCode);
        p.setCategory(category);

        return RowParseResult.ok(p);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(ERROR_EXCEL_EMPTY_FILE);
        }
    }

    private Map<String, Integer> headerIndex(Sheet sheet, List<ImportErrorDto> errors) {
        Row header = sheet.getRow(0);
        if (header == null) {
            errors.add(new ImportErrorDto(1, FIELD_ROW, ERROR_EXCEL_MISSING_HEADER));
            return Map.of();
        }

        Map<String, Integer> idx = new HashMap<>();
        for (Cell c : header) {
            String key = cellToString(c);
            if (!isBlank(key)) {
                idx.put(key.trim().toLowerCase(), c.getColumnIndex());
            }
        }
        return idx;
    }

    private void requireColumns(
            Map<String, Integer> idx,
            List<ImportErrorDto> errors,
            List<String> required
    ) {
        for (String col : required) {
            if (!idx.containsKey(col)) {
                errors.add(new ImportErrorDto(
                        1,
                        col,
                        MISSING_REQUIRED_COLUMN + col
                ));
            }
        }
    }

    private boolean hasData(Row row) {
        for (Cell c : row) {
            if (!isBlank(cellToString(c))) {
                return true;
            }
        }
        return false;
    }

    private String getString(Row row, Map<String, Integer> idx, String col) {
        Integer i = idx.get(col);
        if (i == null) return null;
        return cellToString(row.getCell(i));
    }

    private Integer getIntRequired(
            Row row,
            Map<String, Integer> idx,
            String col,
            int rowNum,
            List<ImportErrorDto> rowErrors,
            String requiredMessage
    ) {
        Integer i = idx.get(col);
        if (i == null) {
            rowErrors.add(new ImportErrorDto(rowNum, col, MISSING_COLUMN));
            return null;
        }
        String s = cellToString(row.getCell(i));
        if (isBlank(s)) {
            rowErrors.add(new ImportErrorDto(rowNum, col, requiredMessage));
            return null;
        }
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            rowErrors.add(new ImportErrorDto(rowNum, col, INVALID_INT));
            return null;
        }
    }

    private Integer getSecondsPerQuestion(Row row, Map<String, Integer> idx, int rowNum, List<ImportErrorDto> rowErrors) {
        Integer i = idx.get(COL_SECONDS_PER_QUESTION_DEFAULT);
        if (i == null) return null;

        String s = cellToString(row.getCell(i));
        if (isBlank(s)) return null;

        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            rowErrors.add(new ImportErrorDto(
                    rowNum,
                    COL_SECONDS_PER_QUESTION_DEFAULT,
                    INVALID_INT
            ));
            return null;
        }
    }

    private String cellToString(Cell cell) {
        if (cell == null) return null;
        return fmt.formatCellValue(cell).trim();
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private <E extends Enum<E>> E parseEnum(List<ImportErrorDto> rowErrors, int rowNum, String col, String raw, Class<E> enumType) {
        if (isBlank(raw)) return null;
        try {
            return Enum.valueOf(enumType, raw.trim().toUpperCase());
        } catch (Exception e) {
            rowErrors.add(new ImportErrorDto(rowNum, col, INVALID_ENUM_VALUE));
            return null;
        }
    }

    private void ensurePublishedVersionExists(Quiz quiz, Instant now) {
        Integer quizId = quiz.getId();
        if (quizId == null) return;

        Optional<QuizVersion> currentOpt = quizVersionRepo.findByQuizIdAndCurrentTrue(quizId);
        if (currentOpt.isPresent()) {
            QuizVersion v = currentOpt.get();
            if (v.getPublishedAt() == null) {
                v.setPublishedAt(now);
                quizVersionRepo.save(v);
            }
            return;
        }

        List<QuizVersion> versions = quizVersionRepo.findByQuizIdOrderByVersionDesc(quizId);
        if (!versions.isEmpty()) {
            QuizVersion latest = versions.getFirst();
            latest.setCurrent(true);
            if (latest.getPublishedAt() == null) {
                latest.setPublishedAt(now);
            }
            quizVersionRepo.save(latest);
            return;
        }

        QuizVersion v1 = new QuizVersion();
        v1.setQuiz(quiz);
        v1.setVersion(1);
        v1.setCurrent(true);
        v1.setPublishedAt(now);
        quizVersionRepo.save(v1);
    }

    private record RowParseResult<T>(T value, List<ImportErrorDto> errors) {
        static <T> RowParseResult<T> ok(T value) {
            return new RowParseResult<>(value, List.of());
        }

        static <T> RowParseResult<T> withErrors(List<ImportErrorDto> errors) {
            return new RowParseResult<>(null, errors);
        }

        boolean hasErrors() {
            return errors != null && !errors.isEmpty();
        }
    }
    private record SheetContext(Sheet sheet, Map<String, Integer> idx) {}

    private SheetContext prepareSheetContext(
            Workbook wb,
            List<ImportErrorDto> errors,
            List<String> requiredColumns
    ) {
        Sheet sheet = wb.getSheetAt(0);
        Map<String, Integer> idx = headerIndex(sheet, errors);
        requireColumns(idx, errors, requiredColumns);
        return new SheetContext(sheet, idx);
    }

    private ImportResultDto failIfHeaderInvalid(List<ImportErrorDto> errors) {
        return errors.isEmpty() ? null : new ImportResultDto(0, 0, errors);
    }
}