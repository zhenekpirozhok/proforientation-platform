package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.importexport.ImportResultDto;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.impl.ExcelImportServiceImpl;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ExcelImportServiceTest {

    private final TranslationRepository translationRepo = Mockito.mock(TranslationRepository.class);
    private final QuizRepository quizRepo = Mockito.mock(QuizRepository.class);
    private final ProfessionRepository professionRepo = Mockito.mock(ProfessionRepository.class);
    private final ProfessionCategoryRepository categoryRepo = Mockito.mock(ProfessionCategoryRepository.class);
    private final UserRepository userRepo = Mockito.mock(UserRepository.class);
    private final QuizVersionRepository quizVersionRepo = Mockito.mock(QuizVersionRepository.class);
    private final QuestionRepository questionRepo = Mockito.mock(QuestionRepository.class);

    private ExcelImportServiceImpl service;

    @BeforeEach
    void setup() {
        service = new ExcelImportServiceImpl(
                translationRepo,
                quizRepo,
                professionRepo,
                categoryRepo,
                userRepo,
                quizVersionRepo,
                questionRepo
        );
    }

    @Test
    void importQuestions_validExcel_success() throws Exception {
        QuizVersion qv = new QuizVersion();
        qv.setId(1);

        MockMultipartFile file = excelFile(
                "questions.xlsx",
                new String[]{"quiz_version_id", "ord", "qtype", "text_default"},
                new Object[][]{
                        {1, 1, "single_choice", "Question text"}
                }
        );

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(qv));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        List<Question> saved = captureSavedAll(questionRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getTextDefault()).isEqualTo("Question text");
    }

    @Test
    void importQuestions_invalidEnum_returnsError_andDoesNotSave() throws Exception {
        QuizVersion qv = new QuizVersion();
        qv.setId(1);

        MockMultipartFile file = excelFile(
                "questions.xlsx",
                new String[]{"quiz_version_id", "ord", "qtype", "text_default"},
                new Object[][]{
                        {1, 1, "wrong_type", "Question text"}
                }
        );

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(qv));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).hasSize(1);

        List<Question> saved = captureSavedAll(questionRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuestions_missingRequiredField_returnsError_andDoesNotSave() throws Exception {
        QuizVersion qv = new QuizVersion();
        qv.setId(1);

        MockMultipartFile file = excelFile(
                "questions.xlsx",
                new String[]{"quiz_version_id", "ord", "qtype", "text_default"},
                new Object[][]{
                        {1, 1, "single_choice", ""}
                }
        );

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(qv));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).hasSize(1);

        List<Question> saved = captureSavedAll(questionRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuestions_quizVersionNotFound_returnsError_andDoesNotSave() throws Exception {
        MockMultipartFile file = excelFile(
                "questions.xlsx",
                new String[]{"quiz_version_id", "ord", "qtype", "text_default"},
                new Object[][]{
                        {99, 1, "single_choice", "Question text"}
                }
        );

        when(quizVersionRepo.findById(99)).thenReturn(Optional.empty());

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).hasSize(1);

        List<Question> saved = captureSavedAll(questionRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuestions_partialSuccess_savesOnlyValidRows() throws Exception {
        QuizVersion qv = new QuizVersion();
        qv.setId(1);

        MockMultipartFile file = excelFile(
                "questions.xlsx",
                new String[]{"quiz_version_id", "ord", "qtype", "text_default"},
                new Object[][]{
                        {1, 1, "single_choice", "OK"},
                        {1, 2, "wrong_enum", "BAD"}
                }
        );

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(qv));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isEqualTo(2);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).hasSize(1);

        List<Question> saved = captureSavedAll(questionRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getTextDefault()).isEqualTo("OK");
    }

    @Test
    void importQuestions_missingRequiredColumn_returnsHeaderError_andDoesNotSave() throws Exception {
        MockMultipartFile file = excelFile(
                "questions.xlsx",
                new String[]{"quiz_version_id", "ord", "qtype"},
                new Object[][]{
                        {1, 1, "single_choice"}
                }
        );

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isZero();
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        verify(questionRepo, never()).saveAll(any());
    }

    @Test
    void importProfessions_validExcel_success() throws Exception {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(10);

        MockMultipartFile file = excelFile(
                "professions.xlsx",
                new String[]{"code", "title_default", "category_id", "description", "ml_class_code"},
                new Object[][]{
                        {"DEV", "Developer", 10, "Writes code", "ml-1"}
                }
        );

        when(categoryRepo.findById(10)).thenReturn(Optional.of(cat));
        when(professionRepo.findByCode("DEV")).thenReturn(Optional.empty());

        ImportResultDto result = service.importProfessions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        List<Profession> saved = captureSavedAll(professionRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getCode()).isEqualTo("DEV");
    }

    @Test
    void importProfessions_categoryNotFound_returnsError_andDoesNotSave() throws Exception {
        MockMultipartFile file = excelFile(
                "professions.xlsx",
                new String[]{"code", "title_default", "category_id"},
                new Object[][]{
                        {"DEV", "Developer", 999}
                }
        );

        when(categoryRepo.findById(999)).thenReturn(Optional.empty());

        ImportResultDto result = service.importProfessions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Profession> saved = captureSavedAll(professionRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuizzes_validExcel_success() throws Exception {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(5);

        User author = new User();
        author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "status", "processing_mode"},
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, "draft", "llm"}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q1")).thenReturn(Optional.empty());

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getCode()).isEqualTo("Q1");
    }

    @Test
    void importQuizzes_invalidEnum_returnsError_andDoesNotSave() throws Exception {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(5);

        User author = new User();
        author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "status", "processing_mode"},
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, "NOT_A_STATUS", "llm"}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importTranslations_validExcel_success() throws Exception {
        MockMultipartFile file = excelFile(
                "translations.xlsx",
                new String[]{"entity_type", "entity_id", "field", "locale", "text"},
                new Object[][]{
                        {"quiz", 1, "title", "en", "Hello"}
                }
        );

        when(translationRepo.findByEntityTypeAndEntityIdAndFieldAndLocale("quiz", 1, "title", "en"))
                .thenReturn(Optional.empty());

        ImportResultDto result = service.importTranslations(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        List<Translation> saved = captureSavedAll(translationRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getText()).isEqualTo("Hello");
    }

    @Test
    void importTranslations_unsupportedEntity_returnsError_andDoesNotSave() throws Exception {
        MockMultipartFile file = excelFile(
                "translations.xlsx",
                new String[]{"entity_type", "entity_id", "field", "locale", "text"},
                new Object[][]{
                        {"unknown", 1, "title", "en", "Hello"}
                }
        );

        ImportResultDto result = service.importTranslations(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Translation> saved = captureSavedAll(translationRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuestions_emptyFile_throwsIllegalArgumentException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "questions.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[0]
        );

        assertThatThrownBy(() -> service.importQuestions(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("error.excel_empty_file");
    }

    private MockMultipartFile excelFile(String filename, String[] headers, Object[][] rows) throws Exception {
        try (Workbook wb = new XSSFWorkbook()) {
            var sheet = wb.createSheet("Sheet1");

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r + 1);
                Object[] rowVals = rows[r];
                for (int c = 0; c < rowVals.length; c++) {
                    Object v = rowVals[c];
                    if (v == null) continue;

                    Cell cell = row.createCell(c);
                    if (v instanceof Number n) {
                        cell.setCellValue(n.doubleValue());
                    } else if (v instanceof Boolean b) {
                        cell.setCellValue(b);
                    } else {
                        cell.setCellValue(String.valueOf(v));
                    }
                }
            }

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                wb.write(baos);
                return new MockMultipartFile(
                        "file",
                        filename,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        baos.toByteArray()
                );
            }
        }
    }

    @Test
    void importQuizzes_duplicateCodeInFile_secondRowRejected_firstSaved() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "status", "processing_mode"},
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, "draft", "llm"},
                        {"q1", "Quiz One DUP", 5, 7, "draft", "llm"} // duplicates case-insensitive
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q1")).thenReturn(Optional.empty());

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(2);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isNotEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getCode()).isEqualTo("Q1");
    }

    @Test
    void importQuizzes_missingOptionalEnumFields_defaultsToDraftAndLLM() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id"}, // status & processing_mode missing
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q1")).thenReturn(Optional.empty());

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getStatus()).isEqualTo(QuizStatus.DRAFT);
        assertThat(saved.getFirst().getProcessingMode()).isEqualTo(QuizProcessingMode.LLM);
    }

    @Test
    void importQuizzes_existingQuiz_keepsExistingStatusAndMode_whenIncomingBlank() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        Quiz existing = new Quiz();
        existing.setId(123);
        existing.setCode("Q1");
        existing.setStatus(QuizStatus.PUBLISHED);
        existing.setProcessingMode(QuizProcessingMode.LLM);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "status", "processing_mode"},
                new Object[][]{
                        {"Q1", "New Title", 5, 7, "", ""}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q1")).thenReturn(Optional.of(existing));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getId()).isEqualTo(123);
        assertThat(saved.getFirst().getTitleDefault()).isEqualTo("New Title");
        assertThat(saved.getFirst().getStatus()).isEqualTo(QuizStatus.PUBLISHED);
        assertThat(saved.getFirst().getProcessingMode()).isEqualTo(QuizProcessingMode.LLM);
        assertThat(saved.getFirst().getUpdatedAt()).isNotNull();
    }

    @Test
    void importQuizzes_descriptionAndSpq_optionalFields_setWhenProvided() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{
                        "code", "title_default", "category_id", "author_id",
                        "description_default", "seconds_per_question_default"
                },
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, "Desc", 30}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q1")).thenReturn(Optional.empty());

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getDescriptionDefault()).isEqualTo("Desc");
        assertThat(saved.getFirst().getSecondsPerQuestionDefault()).isEqualTo(30);
    }

    @Test
    void importQuizzes_secondsPerQuestion_zeroOrNegative_rowRejected() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{
                        "code", "title_default", "category_id", "author_id",
                        "seconds_per_question_default"
                },
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, 0}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuizzes_secondsPerQuestion_invalidInt_rowRejected() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{
                        "code", "title_default", "category_id", "author_id",
                        "seconds_per_question_default"
                },
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, "abc"}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuizzes_publishedQuiz_currentVersionExistsWithoutPublishedAt_updatesPublishedAt() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        Quiz quiz = new Quiz();
        quiz.setId(100);
        quiz.setCode("Q1");

        QuizVersion current = new QuizVersion();
        current.setId(200);
        current.setQuiz(quiz);
        current.setCurrent(true);
        current.setPublishedAt(null);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "status"},
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, "published"}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q1")).thenReturn(Optional.of(quiz));

        when(quizVersionRepo.findByQuizIdAndCurrentTrue(100)).thenReturn(Optional.of(current));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        verify(quizVersionRepo).save(argThat(v -> v.getPublishedAt() != null));
    }

    @Test
    void importQuizzes_publishedQuiz_noCurrentButHasVersions_marksLatestCurrent_andPublishes() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        Quiz quiz = new Quiz();
        quiz.setId(101);
        quiz.setCode("Q2");

        QuizVersion v2 = new QuizVersion();
        v2.setId(222);
        v2.setQuiz(quiz);
        v2.setVersion(2);
        v2.setCurrent(false);
        v2.setPublishedAt(null);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "status"},
                new Object[][]{
                        {"Q2", "Quiz Two", 5, 7, "published"}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q2")).thenReturn(Optional.of(quiz));

        when(quizVersionRepo.findByQuizIdAndCurrentTrue(101)).thenReturn(Optional.empty());
        when(quizVersionRepo.findByQuizIdOrderByVersionDesc(101)).thenReturn(List.of(v2));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.successCount()).isEqualTo(1);

        verify(quizVersionRepo).save(argThat(v ->
                v.getId().equals(222)
                        && v.isCurrent()
                        && v.getPublishedAt() != null
        ));
    }

    @Test
    void importQuizzes_publishedQuiz_noVersions_createsV1CurrentPublished() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        Quiz quiz = new Quiz();
        quiz.setId(102);
        quiz.setCode("Q3");

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "status"},
                new Object[][]{
                        {"Q3", "Quiz Three", 5, 7, "published"}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q3")).thenReturn(Optional.of(quiz));

        when(quizVersionRepo.findByQuizIdAndCurrentTrue(102)).thenReturn(Optional.empty());
        when(quizVersionRepo.findByQuizIdOrderByVersionDesc(102)).thenReturn(List.of());

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.successCount()).isEqualTo(1);

        verify(quizVersionRepo).save(argThat(v ->
                v.getId() == null
                        && v.getQuiz() == quiz
                        && v.getVersion() == 1
                        && v.isCurrent()
                        && v.getPublishedAt() != null
        ));
    }

    @Test
    void importProfessions_duplicateCodeInFile_secondRowRejected_firstSaved() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(10);

        MockMultipartFile file = excelFile(
                "professions.xlsx",
                new String[]{"code", "title_default", "category_id"},
                new Object[][]{
                        {"DEV", "Developer", 10},
                        {"dev", "Developer 2", 10}
                }
        );

        when(categoryRepo.findById(10)).thenReturn(Optional.of(cat));
        when(professionRepo.findByCode("DEV")).thenReturn(Optional.empty());

        ImportResultDto result = service.importProfessions(file);

        assertThat(result.totalRows()).isEqualTo(2);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isNotEmpty();

        List<Profession> saved = captureSavedAll(professionRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getCode()).isEqualTo("DEV");
    }

    @Test
    void importProfessions_optionalFields_blankBecomeNull() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(10);

        MockMultipartFile file = excelFile(
                "professions.xlsx",
                new String[]{"code", "title_default", "category_id", "description", "ml_class_code"},
                new Object[][]{
                        {"DEV", "Developer", 10, "   ", ""}
                }
        );

        when(categoryRepo.findById(10)).thenReturn(Optional.of(cat));
        when(professionRepo.findByCode("DEV")).thenReturn(Optional.empty());

        ImportResultDto result = service.importProfessions(file);

        assertThat(result.successCount()).isEqualTo(1);

        List<Profession> saved = captureSavedAll(professionRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getDescription()).isNull();
        assertThat(saved.getFirst().getMlClassCode()).isNull();
    }

    @Test
    void importProfessions_existingProfession_updatesFields() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(10);

        Profession existing = new Profession();
        existing.setId(55);
        existing.setCode("DEV");
        existing.setTitleDefault("Old");

        MockMultipartFile file = excelFile(
                "professions.xlsx",
                new String[]{"code", "title_default", "category_id", "description"},
                new Object[][]{
                        {"DEV", "New", 10, "Writes code"}
                }
        );

        when(categoryRepo.findById(10)).thenReturn(Optional.of(cat));
        when(professionRepo.findByCode("DEV")).thenReturn(Optional.of(existing));

        ImportResultDto result = service.importProfessions(file);

        assertThat(result.successCount()).isEqualTo(1);

        List<Profession> saved = captureSavedAll(professionRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getId()).isEqualTo(55);
        assertThat(saved.getFirst().getTitleDefault()).isEqualTo("New");
        assertThat(saved.getFirst().getCategory()).isEqualTo(cat);
    }

    @Test
    void importProfessions_missingHeaderRow_returnsError() throws Exception {
        MockMultipartFile file = excelFileWithoutHeader("professions.xlsx");

        ImportResultDto result = service.importProfessions(file);

        assertThat(result.totalRows()).isZero();
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        verify(professionRepo, never()).saveAll(any());
    }

    @Test
    void importTranslations_missingRequiredField_entityTypeBlank_rowRejected() throws Exception {
        MockMultipartFile file = excelFile(
                "translations.xlsx",
                new String[]{"entity_type", "entity_id", "field", "locale", "text"},
                new Object[][]{
                        {"", 1, "title", "en", "Hello"}
                }
        );

        ImportResultDto result = service.importTranslations(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Translation> saved = captureSavedAll(translationRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importTranslations_invalidEntityId_notInteger_rowRejected() throws Exception {
        MockMultipartFile file = excelFile(
                "translations.xlsx",
                new String[]{"entity_type", "entity_id", "field", "locale", "text"},
                new Object[][]{
                        {"quiz", "abc", "title", "en", "Hello"}
                }
        );

        ImportResultDto result = service.importTranslations(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Translation> saved = captureSavedAll(translationRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importTranslations_existingTranslation_updatesText() throws Exception {
        Translation existing = new Translation();
        existing.setId(9);
        existing.setEntityType("quiz");
        existing.setEntityId(1);
        existing.setField("title");
        existing.setLocale("en");
        existing.setText("Old");

        MockMultipartFile file = excelFile(
                "translations.xlsx",
                new String[]{"entity_type", "entity_id", "field", "locale", "text"},
                new Object[][]{
                        {"quiz", 1, "title", "en", "New text"}
                }
        );

        when(translationRepo.findByEntityTypeAndEntityIdAndFieldAndLocale("quiz", 1, "title", "en"))
                .thenReturn(Optional.of(existing));

        ImportResultDto result = service.importTranslations(file);

        assertThat(result.successCount()).isEqualTo(1);

        List<Translation> saved = captureSavedAll(translationRepo);
        assertThat(saved).hasSize(1);
        assertThat(saved.getFirst().getId()).isEqualTo(9);
        assertThat(saved.getFirst().getText()).isEqualTo("New text");
    }

    @Test
    void importQuestions_blankRows_ignored_totalCountsOnlyNonBlankRows() throws Exception {
        QuizVersion qv = new QuizVersion();
        qv.setId(1);

        MockMultipartFile file = excelFile(
                "questions.xlsx",
                new String[]{"quiz_version_id", "ord", "qtype", "text_default"},
                new Object[][]{
                        {1, 1, "single_choice", "OK"},
                        {"", "", "", ""}
                }
        );

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(qv));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);

        List<Question> saved = captureSavedAll(questionRepo);
        assertThat(saved).hasSize(1);
    }

    @Test
    void importQuestions_missingColumn_ord_returnsHeaderError() throws Exception {
        MockMultipartFile file = excelFile(
                "questions.xlsx",
                new String[]{"quiz_version_id", "qtype", "text_default"},
                new Object[][]{
                        {1, "single_choice", "Question"}
                }
        );

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isZero();
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        verify(questionRepo, never()).saveAll(any());
    }

    @Test
    void importQuizzes_headerCaseAndSpaces_areNormalized() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{" Code ", "TITLE_DEFAULT", " Category_Id ", "AUTHOR_ID"},
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q1")).thenReturn(Optional.empty());

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        verify(quizRepo).saveAll(any());
    }

    @Test
    void importQuizzes_rowMissingColumnCategoryId_addsMissingColumnError_andDoesNotSaveRow() throws Exception {
        // Header has category_id, but row omits the cell value -> required message (MESSAGE_REQUIRED)
        // Missing column branch (MISSING_COLUMN) happens only if column not in header.
        // So to hit MISSING_COLUMN, omit the column from header but still require it.
        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "author_id"}, // category_id missing from header
                new Object[][]{
                        {"Q1", "Quiz One", 7}
                }
        );

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isZero();      // header invalid => fail fast
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        verify(quizRepo, never()).saveAll(any());
    }

    @Test
    void importQuizzes_invalidCategoryId_notInteger_rowRejected() throws Exception {
        // Hit getIntRequired NumberFormatException -> INVALID_INT
        User author = new User(); author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id"},
                new Object[][]{
                        {"Q1", "Quiz One", "abc", 7}
                }
        );

        when(userRepo.findById(7)).thenReturn(Optional.of(author));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        // no valid rows => saveAll called with empty list (your service calls saveAll(valid) always)
        // We can either verify called and captured empty, or verify it is called.
        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuizzes_authorNotFound_rowRejected() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id"},
                new Object[][]{
                        {"Q1", "Quiz One", 5, 999}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(999)).thenReturn(Optional.empty());

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuizzes_invalidProcessingModeEnum_rowRejected() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "processing_mode"},
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, "NOT_A_MODE"}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Quiz> saved = captureSavedAll(quizRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuizzes_publishedQuiz_currentVersionAlreadyPublished_doesNotSaveVersion() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        Quiz quiz = new Quiz();
        quiz.setId(100);
        quiz.setCode("Q1");

        QuizVersion current = new QuizVersion();
        current.setId(200);
        current.setQuiz(quiz);
        current.setCurrent(true);
        current.setPublishedAt(java.time.Instant.now()); // already set

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "status"},
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, "published"}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q1")).thenReturn(Optional.of(quiz));
        when(quizVersionRepo.findByQuizIdAndCurrentTrue(100)).thenReturn(Optional.of(current));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.successCount()).isEqualTo(1);
        verify(quizVersionRepo, never()).save(any(QuizVersion.class));
    }

    @Test
    void importQuizzes_publishedQuiz_quizIdNull_doesNotTouchVersions() throws Exception {
        ProfessionCategory cat = new ProfessionCategory(); cat.setId(5);
        User author = new User(); author.setId(7);

        Quiz quiz = new Quiz();
        // id stays null
        quiz.setCode("Q1");

        MockMultipartFile file = excelFile(
                "quizzes.xlsx",
                new String[]{"code", "title_default", "category_id", "author_id", "status"},
                new Object[][]{
                        {"Q1", "Quiz One", 5, 7, "published"}
                }
        );

        when(categoryRepo.findById(5)).thenReturn(Optional.of(cat));
        when(userRepo.findById(7)).thenReturn(Optional.of(author));
        when(quizRepo.findByCode("Q1")).thenReturn(Optional.of(quiz));

        ImportResultDto result = service.importQuizzes(file);

        assertThat(result.successCount()).isEqualTo(1);

        verify(quizVersionRepo, never()).findByQuizIdAndCurrentTrue(anyInt());
        verify(quizVersionRepo, never()).findByQuizIdOrderByVersionDesc(anyInt());
        verify(quizVersionRepo, never()).save(any());
    }

    @Test
    void importTranslations_multipleProblemsInRow_collectsMultipleErrors() throws Exception {
        MockMultipartFile file = excelFile(
                "translations.xlsx",
                new String[]{"entity_type", "entity_id", "field", "locale", "text"},
                new Object[][]{
                        {"unknown", "abc", "", "", "Hello"} // unsupported entity + invalid int + missing required fields
                }
        );

        ImportResultDto result = service.importTranslations(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();

        // should accumulate more than 1 error from the same row
        assertThat(result.errors().size()).isGreaterThanOrEqualTo(2);

        List<Translation> saved = captureSavedAll(translationRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importTranslations_blankRow_isIgnored_totalRowsCountsOnlyNonBlankRows() throws Exception {
        MockMultipartFile file = excelFile(
                "translations.xlsx",
                new String[]{"entity_type", "entity_id", "field", "locale", "text"},
                new Object[][]{
                        {"quiz", 1, "title", "en", "Hello"},
                        {"", "", "", "", ""} // blank row
                }
        );

        when(translationRepo.findByEntityTypeAndEntityIdAndFieldAndLocale("quiz", 1, "title", "en"))
                .thenReturn(Optional.empty());

        ImportResultDto result = service.importTranslations(file);

        assertThat(result.totalRows()).isEqualTo(1);  // blank ignored
        assertThat(result.successCount()).isEqualTo(1);

        List<Translation> saved = captureSavedAll(translationRepo);
        assertThat(saved).hasSize(1);
    }

    @Test
    void importProfessions_invalidCategoryId_notInteger_rowRejected() throws Exception {
        MockMultipartFile file = excelFile(
                "professions.xlsx",
                new String[]{"code", "title_default", "category_id"},
                new Object[][]{
                        {"DEV", "Developer", "abc"}
                }
        );

        ImportResultDto result = service.importProfessions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Profession> saved = captureSavedAll(professionRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuestions_invalidOrd_notInteger_rowRejected() throws Exception {
        MockMultipartFile file = excelFile(
                "questions.xlsx",
                new String[]{"quiz_version_id", "ord", "qtype", "text_default"},
                new Object[][]{
                        {1, "abc", "single_choice", "Question text"}
                }
        );

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(new QuizVersion()));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).isNotEmpty();

        List<Question> saved = captureSavedAll(questionRepo);
        assertThat(saved).isEmpty();
    }

    @Test
    void importQuestions_nullFile_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> service.importQuestions(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void importProfessions_emptyFile_throwsIllegalArgumentException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "professions.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[0]
        );

        assertThatThrownBy(() -> service.importProfessions(file))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private MockMultipartFile excelFileWithoutHeader(String filename) throws Exception {
        try (Workbook wb = new XSSFWorkbook()) {
            var sheet = wb.createSheet("Sheet1");

            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("DEV");
            row.createCell(1).setCellValue("Developer");
            row.createCell(2).setCellValue(10);

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                wb.write(baos);
                return new MockMultipartFile(
                        "file",
                        filename,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        baos.toByteArray()
                );
            }
        }
    }

    private static <T> List<T> toList(Iterable<T> it) {
        List<T> out = new ArrayList<>();
        if (it != null) {
            it.forEach(out::add);
        }
        return out;
    }

    private List<Question> captureSavedAll(QuestionRepository repo) {
        ArgumentCaptor<Iterable<Question>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(repo).saveAll(captor.capture());
        return toList(captor.getValue());
    }

    private List<Profession> captureSavedAll(ProfessionRepository repo) {
        ArgumentCaptor<Iterable<Profession>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(repo).saveAll(captor.capture());
        return toList(captor.getValue());
    }

    private List<Quiz> captureSavedAll(QuizRepository repo) {
        ArgumentCaptor<Iterable<Quiz>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(repo).saveAll(captor.capture());
        return toList(captor.getValue());
    }

    private List<Translation> captureSavedAll(TranslationRepository repo) {
        ArgumentCaptor<Iterable<Translation>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(repo).saveAll(captor.capture());
        return toList(captor.getValue());
    }
}