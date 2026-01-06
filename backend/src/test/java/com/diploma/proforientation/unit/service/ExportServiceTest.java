package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.exception.CsvExportException;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.ExportService;
import com.diploma.proforientation.service.impl.ExportServiceImpl;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExportServiceTest {

    @Mock QuizRepository quizRepo;
    @Mock QuizVersionRepository quizVersionRepo;
    @Mock QuestionRepository questionRepo;
    @Mock QuestionOptionRepository optionRepo;
    @Mock ProfessionRepository professionRepo;
    @Mock AttemptRepository attemptRepo;
    @Mock TranslationRepository translationRepo;

    ExportService service;

    @BeforeEach
    void setUp() {
        ExportServiceImpl impl = new ExportServiceImpl(
                quizRepo,
                quizVersionRepo,
                questionRepo,
                optionRepo,
                professionRepo,
                attemptRepo,
                translationRepo
        );
        impl.initExporters();
        service = impl;
    }

    @Test
    void exportQuestions_singleRow_returnsCsv() {
        QuizVersion version = new QuizVersion();
        version.setId(1);

        Question q = new Question();
        q.setId(10);
        q.setQuizVersion(version);
        q.setOrd(1);
        q.setQtype(QuestionType.SINGLE_CHOICE);
        q.setTextDefault("Question text");

        when(questionRepo.findAll()).thenReturn(List.of(q));

        String csv = csv(service.exportEntityToCsv("questions"));

        assertThat(csv).contains(
                "id,quiz_version_id,ord,qtype,text_default",
                "10,1,1,SINGLE_CHOICE,Question text"
        );

        verify(questionRepo).findAll();
    }

    @Test
    void exportQuestions_empty_returnsHeaderOnly() {
        when(questionRepo.findAll()).thenReturn(List.of());

        String csv = csv(service.exportEntityToCsv("questions"));

        assertThat(csv.trim())
                .isEqualTo("id,quiz_version_id,ord,qtype,text_default");

        verify(questionRepo).findAll();
    }

    @Test
    void exportQuestionOptions_singleRow_returnsCsv() {
        Question q = new Question();
        q.setId(5);

        QuestionOption o = new QuestionOption();
        o.setId(20);
        o.setQuestion(q);
        o.setOrd(1);
        o.setLabelDefault("Option A");

        when(optionRepo.findAll()).thenReturn(List.of(o));

        String csv = csv(service.exportEntityToCsv("question_options"));

        assertThat(csv).contains(
                "id,question_id,ord,label_default",
                "20,5,1,Option A"
        );

        verify(optionRepo).findAll();
    }

    @Test
    void exportTranslations_singleRow_returnsCsv() {
        Translation t = new Translation();
        t.setId(1);
        t.setEntityType("question");
        t.setEntityId(10);
        t.setLocale("en");
        t.setField("text");
        t.setText("Translated text");

        when(translationRepo.findAll()).thenReturn(List.of(t));

        String csv = csv(service.exportEntityToCsv("translations"));

        assertThat(csv).contains(
                "id,entity_type,entity_id,locale,field,text",
                "1,question,10,en,text,Translated text"
        );

        verify(translationRepo).findAll();
    }

    @Test
    void exportAttempts_guestAttempt_returnsCsv() {
        QuizVersion version = new QuizVersion();
        version.setId(3);

        Attempt a = new Attempt();
        a.setId(7);
        a.setQuizVersion(version);
        a.setGuestToken("guest-123");
        a.setLocale("en");
        UUID uuid = UUID.fromString("123e4567-e89b-12d3-a456-426614174000");
        a.setUuid(uuid);
        a.setStartedAt(null);
        a.setSubmittedAt(null);

        when(attemptRepo.findAll()).thenReturn(List.of(a));

        String csv = csv(service.exportEntityToCsv("attempts"));

        assertThat(csv).contains(
                "id,quiz_version_id,user_id,guest_token,locale,started_at,submitted_at,uuid",
                "7,3,,guest-123,en,,," + "123e4567-e89b-12d3-a456-426614174000"
        );

        verify(attemptRepo).findAll();
    }

    @Test
    void exportUnsupportedEntity_throwsException() {
        assertThatThrownBy(() -> service.exportEntityToCsv("unknown"))
                .isInstanceOf(CsvExportException.class)
                .hasMessageContaining("Unsupported export entity");
    }

    @Test
    void exportAllToExcel_createsAllSheets() throws Exception {
        when(quizRepo.findAll()).thenReturn(List.of());
        when(quizVersionRepo.findAll()).thenReturn(List.of());
        when(questionRepo.findAll()).thenReturn(List.of());
        when(optionRepo.findAll()).thenReturn(List.of());
        when(professionRepo.findAll()).thenReturn(List.of());
        when(attemptRepo.findAll()).thenReturn(List.of());
        when(translationRepo.findAll()).thenReturn(List.of());

        Workbook wb = workbook(service.exportAllToExcel());

        assertThat(wb.getSheet("quizzes")).isNotNull();
        assertThat(wb.getSheet("quiz_versions")).isNotNull();
        assertThat(wb.getSheet("questions")).isNotNull();
        assertThat(wb.getSheet("question_options")).isNotNull();
        assertThat(wb.getSheet("professions")).isNotNull();
        assertThat(wb.getSheet("attempts")).isNotNull();
        assertThat(wb.getSheet("translations")).isNotNull();
    }

    @Test
    void exportQuestions_sheetContainsRow() throws Exception {
        QuizVersion version = new QuizVersion();
        version.setId(1);

        Question q = new Question();
        q.setId(10);
        q.setQuizVersion(version);
        q.setOrd(1);
        q.setQtype(QuestionType.MULTI_CHOICE);
        q.setTextDefault("Question text");

        when(questionRepo.findAll()).thenReturn(List.of(q));
        when(quizRepo.findAll()).thenReturn(List.of());
        when(quizVersionRepo.findAll()).thenReturn(List.of());
        when(optionRepo.findAll()).thenReturn(List.of());
        when(professionRepo.findAll()).thenReturn(List.of());
        when(attemptRepo.findAll()).thenReturn(List.of());
        when(translationRepo.findAll()).thenReturn(List.of());

        Workbook wb = workbook(service.exportAllToExcel());
        Sheet s = wb.getSheet("questions");

        Row header = s.getRow(0);
        Row data = s.getRow(1);

        assertThat(header.getCell(0).getStringCellValue()).isEqualTo("id");
        assertThat(header.getCell(3).getStringCellValue()).isEqualTo("qtype");

        assertThat(data.getCell(0).getStringCellValue()).isEqualTo("10");
        assertThat(data.getCell(1).getStringCellValue()).isEqualTo("1");
        assertThat(data.getCell(2).getStringCellValue()).isEqualTo("1");
        assertThat(data.getCell(3).getStringCellValue()).isEqualTo("MULTI_CHOICE");
        assertThat(data.getCell(4).getStringCellValue()).isEqualTo("Question text");
    }

    @Test
    void exportAttempts_guestAttempt_writtenCorrectly() throws Exception {
        QuizVersion version = new QuizVersion();
        version.setId(5);

        Attempt a = new Attempt();
        a.setId(3);
        a.setQuizVersion(version);
        a.setGuestToken("guest-1");
        a.setLocale("en");
        UUID uuid = UUID.fromString("123e4567-e89b-12d3-a456-426614174000");
        a.setUuid(uuid);

        when(attemptRepo.findAll()).thenReturn(List.of(a));
        when(quizRepo.findAll()).thenReturn(List.of());
        when(quizVersionRepo.findAll()).thenReturn(List.of());
        when(questionRepo.findAll()).thenReturn(List.of());
        when(optionRepo.findAll()).thenReturn(List.of());
        when(professionRepo.findAll()).thenReturn(List.of());
        when(translationRepo.findAll()).thenReturn(List.of());

        Workbook wb = workbook(service.exportAllToExcel());
        Sheet s = wb.getSheet("attempts");

        Row row = s.getRow(1);

        assertThat(row.getCell(0).getStringCellValue()).isEqualTo("3");
        assertThat(row.getCell(1).getStringCellValue()).isEqualTo("5");
        assertThat(row.getCell(2).getStringCellValue()).isEmpty(); // user_id
        assertThat(row.getCell(3).getStringCellValue()).isEqualTo("guest-1");
        assertThat(row.getCell(4).getStringCellValue()).isEqualTo("en");
        assertThat(row.getCell(7).getStringCellValue()).isEqualTo("123e4567-e89b-12d3-a456-426614174000");
    }

    @Test
    void exportEmptyRepositories_onlyHeadersPresent() throws Exception {
        when(quizRepo.findAll()).thenReturn(List.of());
        when(quizVersionRepo.findAll()).thenReturn(List.of());
        when(questionRepo.findAll()).thenReturn(List.of());
        when(optionRepo.findAll()).thenReturn(List.of());
        when(professionRepo.findAll()).thenReturn(List.of());
        when(attemptRepo.findAll()).thenReturn(List.of());
        when(translationRepo.findAll()).thenReturn(List.of());

        Workbook wb = workbook(service.exportAllToExcel());

        Sheet s = wb.getSheet("questions");
        assertThat(s.getPhysicalNumberOfRows()).isEqualTo(1);
    }

    @Test
    void exportQuizzes_singleRow_returnsCsv() {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(2);

        User author = new User();
        author.setId(1);

        Quiz quiz = new Quiz();
        quiz.setId(11);
        quiz.setCode("riasec_main");
        quiz.setTitleDefault("Career Orientation Test (RIASEC)");
        quiz.setDescriptionDefault("Desc");
        quiz.setStatus(QuizStatus.PUBLISHED);
        quiz.setProcessingMode(QuizProcessingMode.ML_RIASEC);
        quiz.setCategory(cat);
        quiz.setAuthor(author);
        quiz.setSecondsPerQuestionDefault(30);

        when(quizRepo.findAll()).thenReturn(List.of(quiz));

        String csv = csv(service.exportEntityToCsv("quizzes"));

        assertThat(csv).contains(
                "id,code,title_default,description_default,status,processing_mode,category_id,author_id",
                "11,riasec_main,Career Orientation Test (RIASEC),Desc,PUBLISHED,ML_RIASEC,2,1,30"
        );
        verify(quizRepo).findAll();
    }

    @Test
    void exportQuizVersions_singleRow_returnsCsv() {
        Quiz quiz = new Quiz();
        quiz.setId(9);

        QuizVersion v = new QuizVersion();
        v.setId(100);
        v.setQuiz(quiz);
        v.setVersion(2);
        v.setCurrent(true);
        v.setPublishedAt(null);

        when(quizVersionRepo.findAll()).thenReturn(List.of(v));

        String csv = csv(service.exportEntityToCsv("quiz_versions"));

        assertThat(csv).contains(
                "id,quiz_id,version,current,published_at",
                "100,9,2,true,"
        );

        verify(quizVersionRepo).findAll();
    }

    @Test
    void exportProfessions_singleRow_returnsCsv() {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(4);

        Profession p = new Profession();
        p.setId(77);
        p.setCode("dev_java");
        p.setTitleDefault("Java Developer");
        p.setDescription("Writes Java");
        p.setMlClassCode("A12");
        p.setCategory(cat);

        when(professionRepo.findAll()).thenReturn(List.of(p));

        String csv = csv(service.exportEntityToCsv("professions"));

        assertThat(csv).contains(
                "id,code,title_default,description,ml_class_code,category_id",
                "77,dev_java,Java Developer,Writes Java,A12,4"
        );

        verify(professionRepo).findAll();
    }

    @Test
    void exportQuizzes_excelRowContainsValues() throws Exception {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(2);

        User author = new User();
        author.setId(1);

        Quiz quiz = new Quiz();
        quiz.setId(11);
        quiz.setCode("riasec_main");
        quiz.setTitleDefault("Career Orientation Test (RIASEC)");
        quiz.setDescriptionDefault("Desc");
        quiz.setStatus(QuizStatus.PUBLISHED);
        quiz.setProcessingMode(QuizProcessingMode.ML_RIASEC);
        quiz.setCategory(cat);
        quiz.setAuthor(author);
        quiz.setSecondsPerQuestionDefault(30);

        when(quizRepo.findAll()).thenReturn(List.of(quiz));
        when(quizVersionRepo.findAll()).thenReturn(List.of());
        when(questionRepo.findAll()).thenReturn(List.of());
        when(optionRepo.findAll()).thenReturn(List.of());
        when(professionRepo.findAll()).thenReturn(List.of());
        when(attemptRepo.findAll()).thenReturn(List.of());
        when(translationRepo.findAll()).thenReturn(List.of());

        Workbook wb = workbook(service.exportAllToExcel());
        Sheet s = wb.getSheet("quizzes");

        assertThat(cell(s, 0, 0)).isEqualTo("id");
        assertThat(cell(s, 0, 1)).isEqualTo("code");

        assertThat(cell(s, 1, 0)).isEqualTo("11");
        assertThat(cell(s, 1, 1)).isEqualTo("riasec_main");
        assertThat(cell(s, 1, 2)).isEqualTo("Career Orientation Test (RIASEC)");
        assertThat(cell(s, 1, 3)).isEqualTo("Desc");
        assertThat(cell(s, 1, 4)).isEqualTo("PUBLISHED");
        assertThat(cell(s, 1, 5)).isEqualTo("ML_RIASEC");
        assertThat(cell(s, 1, 6)).isEqualTo("2");
        assertThat(cell(s, 1, 7)).isEqualTo("1");
        assertThat(cell(s, 1, 8)).isEqualTo("30");
    }

    @Test
    void exportQuizVersions_excelRowContainsValues() throws Exception {
        Quiz quiz = new Quiz();
        quiz.setId(9);

        QuizVersion v = new QuizVersion();
        v.setId(100);
        v.setQuiz(quiz);
        v.setVersion(2);
        v.setCurrent(true);
        v.setPublishedAt(null);

        when(quizVersionRepo.findAll()).thenReturn(List.of(v));
        when(quizRepo.findAll()).thenReturn(List.of());
        when(questionRepo.findAll()).thenReturn(List.of());
        when(optionRepo.findAll()).thenReturn(List.of());
        when(professionRepo.findAll()).thenReturn(List.of());
        when(attemptRepo.findAll()).thenReturn(List.of());
        when(translationRepo.findAll()).thenReturn(List.of());

        Workbook wb = workbook(service.exportAllToExcel());
        Sheet s = wb.getSheet("quiz_versions");

        assertThat(cell(s, 0, 0)).isEqualTo("id");
        assertThat(cell(s, 0, 1)).isEqualTo("quiz_id");

        assertThat(cell(s, 1, 0)).isEqualTo("100");
        assertThat(cell(s, 1, 1)).isEqualTo("9");
        assertThat(cell(s, 1, 2)).isEqualTo("2");
        assertThat(cell(s, 1, 3)).isEqualTo("true");
        assertThat(cell(s, 1, 4)).isEmpty();
    }

    @Test
    void exportProfessions_excelRowContainsValues() throws Exception {
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(4);

        Profession p = new Profession();
        p.setId(77);
        p.setCode("dev_java");
        p.setTitleDefault("Java Developer");
        p.setDescription("Writes Java");
        p.setMlClassCode("A12");
        p.setCategory(cat);

        when(professionRepo.findAll()).thenReturn(List.of(p));
        when(quizRepo.findAll()).thenReturn(List.of());
        when(quizVersionRepo.findAll()).thenReturn(List.of());
        when(questionRepo.findAll()).thenReturn(List.of());
        when(optionRepo.findAll()).thenReturn(List.of());
        when(attemptRepo.findAll()).thenReturn(List.of());
        when(translationRepo.findAll()).thenReturn(List.of());

        Workbook wb = workbook(service.exportAllToExcel());
        Sheet s = wb.getSheet("professions");

        assertThat(cell(s, 0, 0)).isEqualTo("id");
        assertThat(cell(s, 0, 1)).isEqualTo("code");

        assertThat(cell(s, 1, 0)).isEqualTo("77");
        assertThat(cell(s, 1, 1)).isEqualTo("dev_java");
        assertThat(cell(s, 1, 2)).isEqualTo("Java Developer");
        assertThat(cell(s, 1, 3)).isEqualTo("Writes Java");
        assertThat(cell(s, 1, 4)).isEqualTo("A12");
        assertThat(cell(s, 1, 5)).isEqualTo("4");
    }

    @Test
    void exportAllToExcel_callsAllRepositoriesOnce() {
        when(quizRepo.findAll()).thenReturn(List.of());
        when(quizVersionRepo.findAll()).thenReturn(List.of());
        when(questionRepo.findAll()).thenReturn(List.of());
        when(optionRepo.findAll()).thenReturn(List.of());
        when(professionRepo.findAll()).thenReturn(List.of());
        when(attemptRepo.findAll()).thenReturn(List.of());
        when(translationRepo.findAll()).thenReturn(List.of());

        service.exportAllToExcel();

        verify(quizRepo, times(1)).findAll();
        verify(quizVersionRepo, times(1)).findAll();
        verify(questionRepo, times(1)).findAll();
        verify(optionRepo, times(1)).findAll();
        verify(professionRepo, times(1)).findAll();
        verify(attemptRepo, times(1)).findAll();
        verify(translationRepo, times(1)).findAll();
    }


    private String csv(byte[] bytes) {
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private Workbook workbook(byte[] bytes) throws Exception {
        return new XSSFWorkbook(new ByteArrayInputStream(bytes));
    }

    private String cell(Sheet s, int row, int col) {
        Row r = s.getRow(row);
        if (r == null || r.getCell(col) == null) return "";
        return r.getCell(col).getStringCellValue();
    }
}
