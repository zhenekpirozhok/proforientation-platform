package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.importexport.ImportErrorDto;
import com.diploma.proforientation.dto.importexport.ImportResultDto;
import com.diploma.proforientation.service.CsvImportService;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuizVersion;
import com.diploma.proforientation.model.Translation;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.repository.QuizVersionRepository;
import com.diploma.proforientation.repository.TranslationRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static com.diploma.proforientation.util.Constants.*;

@Service
@RequiredArgsConstructor
public class CsvImportServiceImpl implements CsvImportService {

    private final QuizVersionRepository quizVersionRepo;
    private final QuestionRepository questionRepo;
    private final TranslationRepository translationRepo;

    @Transactional
    public ImportResultDto importQuestions(MultipartFile file) {

        List<ImportErrorDto> errors = new ArrayList<>();
        int[] success = {0};
        int[] rowNum = {1}; // header = 1

        try (
                CSVReader reader = new CSVReader(
                        new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)
                )
        ) {
            String[] header = reader.readNext();
            Map<String, Integer> idx = indexMap(header);

            processQuestionRows(reader, idx, errors, rowNum, success);

        } catch (Exception e) {
            throw new RuntimeException(CSV_IMPORT_FAILED, e);
        }

        return new ImportResultDto(rowNum[0] - 1, success[0], errors);
    }

    @Transactional
    public ImportResultDto importTranslations(MultipartFile file) {

        List<ImportErrorDto> errors = new ArrayList<>();
        int success = 0;
        int rowNum = 1;

        try (
                CSVReader reader = new CSVReader(
                        new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)
                )
        ) {
            String[] header = reader.readNext();
            Map<String, Integer> idx = indexMap(header);

            validateTranslationHeader(idx);

            String[] row;
            while ((row = reader.readNext()) != null) {
                rowNum++;

                try {
                    Translation translation =
                            parseTranslation(row, idx, rowNum, errors);

                    if (translation != null) {
                        translationRepo.save(translation);
                        success++;
                    }

                } catch (Exception e) {
                    errors.add(
                            new ImportErrorDto(rowNum, FIELD_ROW, e.getMessage())
                    );
                }
            }

        } catch (Exception e) {
            throw new RuntimeException(TRANSLATION_CSV_IMPORT_FAILED, e);
        }

        return new ImportResultDto(rowNum - 1, success, errors);
    }

    private void processQuestionRows(
            CSVReader reader,
            Map<String, Integer> idx,
            List<ImportErrorDto> errors,
            int[] rowNum,
            int[] success
    ) throws IOException, CsvValidationException {

        String[] row;

        while ((row = reader.readNext()) != null) {
            rowNum[0]++;

            try {
                Question question =
                        parseQuestion(row, idx, rowNum[0], errors);

                if (question != null) {
                    questionRepo.save(question);
                    success[0]++;
                }

            } catch (Exception e) {
                errors.add(
                        new ImportErrorDto(rowNum[0], FIELD_ROW, e.getMessage())
                );
            }
        }
    }

    private Map<String, Integer> indexMap(String[] header) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            map.put(header[i].trim().toLowerCase(), i);
        }
        return map;
    }

    private Question parseQuestion(
            String[] row,
            Map<String, Integer> idx,
            int rowNum,
            List<ImportErrorDto> errors
    ) {
        Integer quizVersionId = parseInt(row, idx, FIELD_QUIZ_VERSION_ID, rowNum, errors);
        Integer ord = parseInt(row, idx, FIELD_ORD, rowNum, errors);
        String qtypeStr = parseString(row, idx, FIELD_QTYPE, rowNum, errors);
        String text = parseString(row, idx, FIELD_TEXT_DEFAULT, rowNum, errors);

        if (quizVersionId == null || ord == null || qtypeStr == null || text == null) {
            return null;
        }

        QuizVersion version = quizVersionRepo.findById(quizVersionId)
                .orElseGet(() -> {
                    errors.add(new ImportErrorDto(rowNum, FIELD_QUIZ_VERSION_ID, QUIZ_VERSION_NOT_FOUND));
                    return null;
                });

        QuestionType qtype = parseQuestionType(qtypeStr, rowNum, errors);

        if (version == null || qtype == null) {
            return null;
        }

        Question q = new Question();
        q.setQuizVersion(version);
        q.setOrd(ord);
        q.setQtype(qtype);
        q.setTextDefault(text);

        return q;
    }

    private Integer parseInt(
            String[] row,
            Map<String, Integer> idx,
            String field,
            int rowNum,
            List<ImportErrorDto> errors
    ) {
        try {
            String value = row[idx.get(field)];
            if (value == null || value.isBlank()) {
                errors.add(new ImportErrorDto(rowNum, field, MESSAGE_REQUIRED));
                return null;
            }
            return Integer.parseInt(value);
        } catch (Exception e) {
            errors.add(new ImportErrorDto(rowNum, field, INVALID_INT));
            return null;
        }
    }

    private QuestionType parseQuestionType(String qtypeStr, int rowNum, List<ImportErrorDto> errors) {
        if (qtypeStr == null || qtypeStr.isBlank()) {
            errors.add(new ImportErrorDto(rowNum, FIELD_QTYPE, MESSAGE_MISSING));
            return null;
        }

        try {
            return QuestionType.valueOf(qtypeStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            errors.add(new ImportErrorDto(rowNum, FIELD_QTYPE, INVALID_ENUM_VALUE));
            return null;
        }
    }

    private String parseString(
            String[] row,
            Map<String, Integer> idx,
            String field,
            int rowNum,
            List<ImportErrorDto> errors
    ) {
        try {
            String value = row[idx.get(field)];
            if (value == null || value.isBlank()) {
                errors.add(new ImportErrorDto(rowNum, field, MESSAGE_REQUIRED));
                return null;
            }
            return value;
        } catch (Exception e) {
            errors.add(new ImportErrorDto(rowNum, field, MISSING_COLUMN));
            return null;
        }
    }

    private void validateTranslationHeader(Map<String, Integer> idx) {
        List<String> required = List.of(
                COL_ENTITY_TYPE, COL_ENTITY_ID, COL_FIELD, COL_LOCALE, COL_TEXT
        );

        for (String col : required) {
            if (!idx.containsKey(col)) {
                throw new IllegalArgumentException(
                        MISSING_REQUIRED_COLUMN + col
                );
            }
        }
    }

    private Translation parseTranslation(
            String[] row,
            Map<String, Integer> idx,
            int rowNum,
            List<ImportErrorDto> errors
    ) {

        String entityType = get(row, idx, COL_ENTITY_TYPE);
        String field = get(row, idx, COL_FIELD);
        String locale = get(row, idx, COL_LOCALE);
        String text = get(row, idx, COL_TEXT);

        Integer entityId;
        try {
            entityId = Integer.valueOf(get(row, idx, COL_ENTITY_ID));
        } catch (NumberFormatException e) {
            errors.add(new ImportErrorDto(rowNum, COL_ENTITY_ID, NOT_INTEGER));
            return null;
        }

        if (entityType.isBlank() || field.isBlank() || locale.isBlank()) {
            errors.add(new ImportErrorDto(rowNum, FIELD_ROW, EMPTY_REQUIRED_FIELDS));
            return null;
        }

        if (!Set.of(ENTITY_TYPE_QUIZ, ENTITY_TYPE_QUESTION, ENTITY_TYPE_OPTION, ENTITY_TYPE_PROF)
                .contains(entityType)) {
            errors.add(
                    new ImportErrorDto(rowNum, FIELD_ENTITY_TYPE, UNSUPPORTED_ENTITY)
            );
            return null;
        }

        Translation translation = translationRepo
                .findByEntityTypeAndEntityIdAndFieldAndLocale(
                        entityType, entityId, field, locale
                )
                .orElseGet(Translation::new);

        translation.setEntityType(entityType);
        translation.setEntityId(entityId);
        translation.setField(field);
        translation.setLocale(locale);
        translation.setText(text);

        return translation;
    }

    private String get(String[] row, Map<String, Integer> idx, String col) {
        Integer i = idx.get(col);
        return i == null || i >= row.length ? EMPTY_STRING : row[i].trim();
    }
}
