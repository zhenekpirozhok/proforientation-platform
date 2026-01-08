package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.importexport.ImportResultDto;
import com.diploma.proforientation.model.*;
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
                .hasMessageContaining("Empty Excel file");
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