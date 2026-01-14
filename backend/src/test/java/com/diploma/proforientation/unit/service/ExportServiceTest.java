package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.QuizMetricsFilter;
import com.diploma.proforientation.exception.CsvExportException;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import com.diploma.proforientation.model.view.*;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.repository.view.*;
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
import org.springframework.data.jpa.domain.Specification;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
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
    @Mock QuizPublicMetricsRepository quizPublicMetricsRepo;
    @Mock QuizFunnelOverviewRepository funnelRepo;
    @Mock QuizActivityDailyRepository activityRepo;
    @Mock QuizTopProfessionRepository topProfRepo;
    @Mock QuizQuestionAvgChoiceRepository avgChoiceRepo;
    @Mock QuizQuestionOptionDistributionRepository distRepo;
    @Mock QuizQuestionDiscriminationRepository discRepo;

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
                translationRepo,
                quizPublicMetricsRepo,
                funnelRepo,
                activityRepo,
                topProfRepo,
                avgChoiceRepo,
                distRepo,
                discRepo
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
                .hasMessageContaining("error.unsupported_export_entityunknown");
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

    @Test
    void exportQuizMetricsCsv_singleRow_returnsCsv() {
        QuizPublicMetricsEntity e = new QuizPublicMetricsEntity();
        e.setQuizId(1);
        e.setQuizCode("career_test");
        e.setQuizStatus("PUBLISHED");
        e.setCategoryId(3);
        e.setQuestionsTotal(10);
        e.setAttemptsTotal(100);
        e.setAttemptsSubmitted(80);
        e.setAvgDurationSeconds(BigDecimal.valueOf(650.5));
        e.setEstimatedDurationSeconds(600);

        when(quizPublicMetricsRepo.findAll(any(Specification.class)))
                .thenReturn(List.of(e));

        QuizMetricsFilter filter = new QuizMetricsFilter(
                1, "career", QuizStatus.PUBLISHED, 3,
                null, null, null, null, null, null,
                null, null, null, null
        );

        String csv = csv(service.exportQuizMetricsToCsv(filter));

        assertThat(csv).contains(
                "quiz_id,quiz_code,quiz_status,category_id,questions_total,attempts_total,attempts_submitted,avg_duration_seconds,estimated_duration_seconds",
                "1,career_test,PUBLISHED,3,10,100,80,650.5,600"
        );

        verify(quizPublicMetricsRepo).findAll(any(Specification.class));
        verifyNoMoreInteractions(quizPublicMetricsRepo);
    }

    @Test
    void exportQuizMetricsExcel_singleRow_containsSheetAndRow() throws Exception {
        QuizPublicMetricsEntity e = new QuizPublicMetricsEntity();
        e.setQuizId(1);
        e.setQuizCode("career_test");
        e.setQuizStatus("PUBLISHED");
        e.setCategoryId(3);
        e.setQuestionsTotal(10);
        e.setAttemptsTotal(100);
        e.setAttemptsSubmitted(80);
        e.setAvgDurationSeconds(BigDecimal.valueOf(650.5));
        e.setEstimatedDurationSeconds(600);

        when(quizPublicMetricsRepo.findAll(any(Specification.class)))
                .thenReturn(List.of(e));

        QuizMetricsFilter filter = new QuizMetricsFilter(
                null, null, null, null,
                null, null, null, null, null, null,
                null, null, null, null
        );

        Workbook wb = workbook(service.exportQuizMetricsToExcel(filter));
        Sheet s = wb.getSheet("quiz_public_metrics");

        assertThat(s).isNotNull();

        assertThat(cell(s, 0, 0)).isEqualTo("quiz_id");
        assertThat(cell(s, 0, 1)).isEqualTo("quiz_code");
        assertThat(cell(s, 0, 2)).isEqualTo("quiz_status");

        assertThat(cell(s, 1, 0)).isEqualTo("1");
        assertThat(cell(s, 1, 1)).isEqualTo("career_test");
        assertThat(cell(s, 1, 2)).isEqualTo("PUBLISHED");
        assertThat(cell(s, 1, 3)).isEqualTo("3");
        assertThat(cell(s, 1, 4)).isEqualTo("10");
        assertThat(cell(s, 1, 5)).isEqualTo("100");
        assertThat(cell(s, 1, 6)).isEqualTo("80");
        assertThat(cell(s, 1, 7)).isEqualTo("650.5");
        assertThat(cell(s, 1, 8)).isEqualTo("600");

        verify(quizPublicMetricsRepo).findAll(any(Specification.class));
        verifyNoMoreInteractions(quizPublicMetricsRepo);
    }

    @Test
    void exportQuizMetricsCsv_empty_returnsHeaderOnly() {
        when(quizPublicMetricsRepo.findAll(any(Specification.class)))
                .thenReturn(List.of());

        QuizMetricsFilter filter = new QuizMetricsFilter(
                null, null, null, null,
                null, null, null, null, null, null,
                null, null, null, null
        );

        String csv = csv(service.exportQuizMetricsToCsv(filter)).trim();

        assertThat(csv).isEqualTo(
                "quiz_id,quiz_code,quiz_status,category_id,questions_total,attempts_total,attempts_submitted,avg_duration_seconds,estimated_duration_seconds"
        );

        verify(quizPublicMetricsRepo).findAll(any(Specification.class));
        verifyNoMoreInteractions(quizPublicMetricsRepo);
    }

    @Test
    void exportQuizAnalyticsOverviewCsv_containsFunnelActivityAndTopProfessions() {
        Integer quizId = 1;
        Integer quizVersionId = 10;

        // funnel
        QuizFunnelOverviewEntity f = new QuizFunnelOverviewEntity();
        f.setId(new QuizFunnelOverviewEntity.Id(quizId, quizVersionId));
        f.setAttemptsStarted(100);
        f.setAttemptsCompleted(80);
        f.setCompletionRate(new java.math.BigDecimal("0.800000"));
        f.setAvgDurationSeconds(new java.math.BigDecimal("650.5"));

        when(funnelRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(f);

        // activity daily
        QuizActivityDailyEntity d1 = new QuizActivityDailyEntity();
        d1.setId(new QuizActivityDailyEntity.Id(quizId, quizVersionId, java.time.LocalDate.of(2026, 1, 1)));
        d1.setAttemptsStarted(10);
        d1.setAttemptsCompleted(8);
        d1.setAvgDurationSeconds(new java.math.BigDecimal("600"));

        QuizActivityDailyEntity d2 = new QuizActivityDailyEntity();
        d2.setId(new QuizActivityDailyEntity.Id(quizId, quizVersionId, java.time.LocalDate.of(2026, 1, 2)));
        d2.setAttemptsStarted(20);
        d2.setAttemptsCompleted(15);
        d2.setAvgDurationSeconds(new java.math.BigDecimal("700"));

        when(activityRepo.findByIdQuizIdAndIdQuizVersionIdOrderByIdDayAsc(quizId, quizVersionId))
                .thenReturn(List.of(d1, d2));

        // top professions
        QuizTopProfessionEntity p1 = new QuizTopProfessionEntity();
        p1.setId(new QuizTopProfessionEntity.Id(quizId, quizVersionId, 7));
        p1.setProfessionTitle("Java Developer");
        p1.setTop1Count(12);

        when(topProfRepo.findByIdQuizIdAndIdQuizVersionIdOrderByTop1CountDesc(quizId, quizVersionId))
                .thenReturn(List.of(p1));

        String csv = new String(
                service.exportQuizAnalyticsOverviewCsv(quizId, quizVersionId),
                StandardCharsets.UTF_8
        );

        // funnel header + row
        assertThat(csv).contains("quiz_id,quiz_version_id,attempts_started,attempts_completed,completion_rate,avg_duration_seconds");
        assertThat(csv).contains("1,10,100,80,0.800000,650.5");

        // activity header + rows
        assertThat(csv).contains("day,attempts_started,attempts_completed,avg_duration_seconds");
        assertThat(csv).contains("2026-01-01,10,8,600");
        assertThat(csv).contains("2026-01-02,20,15,700");

        // top professions header + row
        assertThat(csv).contains("profession_id,profession_title,top1_count");
        assertThat(csv).contains("7,Java Developer,12");

        verify(funnelRepo).findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);
        verify(activityRepo).findByIdQuizIdAndIdQuizVersionIdOrderByIdDayAsc(quizId, quizVersionId);
        verify(topProfRepo).findByIdQuizIdAndIdQuizVersionIdOrderByTop1CountDesc(quizId, quizVersionId);
    }

    @Test
    void exportQuizAnalyticsDetailedCsv_containsAvgChoiceDistributionAndDiscrimination() {
        Integer quizId = 2;
        Integer quizVersionId = 20;

        // avg choice
        QuizQuestionAvgChoiceEntity a1 = new QuizQuestionAvgChoiceEntity();
        a1.setId(new QuizQuestionAvgChoiceEntity.Id(quizId, quizVersionId, 100));
        a1.setQuestionOrd(1);
        a1.setAvgChoice(new java.math.BigDecimal("2.5000"));
        a1.setAnswersCount(40);

        when(avgChoiceRepo.findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(quizId, quizVersionId))
                .thenReturn(List.of(a1));

        // option distribution
        QuizQuestionOptionDistributionEntity o1 = new QuizQuestionOptionDistributionEntity();
        o1.setId(new QuizQuestionOptionDistributionEntity.Id(quizId, quizVersionId, 100, 1000));
        o1.setQuestionOrd(1);
        o1.setOptionOrd(1);
        o1.setCount(10);

        when(distRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(List.of(o1));

        // discrimination
        QuizQuestionDiscriminationEntity qd = new QuizQuestionDiscriminationEntity();
        qd.setId(new QuizQuestionDiscriminationEntity.Id(quizId, quizVersionId, 100));
        qd.setDiscNorm(new java.math.BigDecimal("0.250000"));
        qd.setDiscQuality("ok");
        qd.setAttemptsSubmitted(80);

        when(discRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(List.of(qd));

        String csv = new String(
                service.exportQuizAnalyticsDetailedCsv(quizId, quizVersionId),
                StandardCharsets.UTF_8
        );

        assertThat(csv).contains("question_id,question_ord,avg_choice,answers_count");
        assertThat(csv).contains("100,1,2.5000,40");

        assertThat(csv).contains("question_id,question_ord,option_id,option_ord,count");
        assertThat(csv).contains("100,1,1000,1,10");

        assertThat(csv).contains("question_id,disc_norm,disc_quality,attempts_submitted");
        assertThat(csv).contains("100,0.250000,ok,80");

        verify(avgChoiceRepo).findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(quizId, quizVersionId);
        verify(distRepo).findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);
        verify(discRepo).findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);
    }

    @Test
    void exportQuizAnalyticsOverviewExcel_createsSheetsAndWritesRows() throws Exception {
        Integer quizId = 1;
        Integer quizVersionId = 10;

        QuizFunnelOverviewEntity f = new QuizFunnelOverviewEntity();
        f.setId(new QuizFunnelOverviewEntity.Id(quizId, quizVersionId));
        f.setAttemptsStarted(5);
        f.setAttemptsCompleted(3);
        f.setCompletionRate(new java.math.BigDecimal("0.600000"));
        f.setAvgDurationSeconds(new java.math.BigDecimal("100"));

        when(funnelRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId)).thenReturn(f);

        QuizActivityDailyEntity d = new QuizActivityDailyEntity();
        d.setId(new QuizActivityDailyEntity.Id(quizId, quizVersionId, java.time.LocalDate.of(2026, 1, 1)));
        d.setAttemptsStarted(5);
        d.setAttemptsCompleted(3);
        d.setAvgDurationSeconds(new java.math.BigDecimal("100"));

        when(activityRepo.findByIdQuizIdAndIdQuizVersionIdOrderByIdDayAsc(quizId, quizVersionId))
                .thenReturn(List.of(d));

        QuizTopProfessionEntity tp = new QuizTopProfessionEntity();
        tp.setId(new QuizTopProfessionEntity.Id(quizId, quizVersionId, 7));
        tp.setProfessionTitle("Java Developer");
        tp.setTop1Count(1);

        when(topProfRepo.findByIdQuizIdAndIdQuizVersionIdOrderByTop1CountDesc(quizId, quizVersionId))
                .thenReturn(List.of(tp));

        Workbook wb = workbook(service.exportQuizAnalyticsOverviewExcel(quizId, quizVersionId));

        Sheet funnel = wb.getSheet("overview_funnel");
        Sheet activity = wb.getSheet("overview_activity_daily");
        Sheet top = wb.getSheet("overview_top_professions");

        assertThat(funnel).isNotNull();
        assertThat(activity).isNotNull();
        assertThat(top).isNotNull();

        // funnel data row
        assertThat(cell(funnel, 1, 0)).isEqualTo("1");   // quiz_id
        assertThat(cell(funnel, 1, 1)).isEqualTo("10");  // quiz_version_id
        assertThat(cell(funnel, 1, 2)).isEqualTo("5");   // attempts_started
        assertThat(cell(funnel, 1, 3)).isEqualTo("3");   // attempts_completed

        // activity row day
        assertThat(cell(activity, 1, 0)).isEqualTo("2026-01-01");

        // top profession row
        assertThat(cell(top, 1, 0)).isEqualTo("7");
        assertThat(cell(top, 1, 1)).isEqualTo("Java Developer");
        assertThat(cell(top, 1, 2)).isEqualTo("1");
    }

    @Test
    void exportQuizAnalyticsDetailedExcel_createsSheetsAndWritesRows() throws Exception {
        Integer quizId = 2;
        Integer quizVersionId = 20;

        QuizQuestionAvgChoiceEntity avg = new QuizQuestionAvgChoiceEntity();
        avg.setId(new QuizQuestionAvgChoiceEntity.Id(quizId, quizVersionId, 100));
        avg.setQuestionOrd(1);
        avg.setAvgChoice(new java.math.BigDecimal("2.5000"));
        avg.setAnswersCount(40);

        when(avgChoiceRepo.findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(quizId, quizVersionId))
                .thenReturn(List.of(avg));

        QuizQuestionOptionDistributionEntity dist = new QuizQuestionOptionDistributionEntity();
        dist.setId(new QuizQuestionOptionDistributionEntity.Id(quizId, quizVersionId, 100, 1000));
        dist.setQuestionOrd(1);
        dist.setOptionOrd(1);
        dist.setCount(10);

        when(distRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(List.of(dist));

        QuizQuestionDiscriminationEntity disc = new QuizQuestionDiscriminationEntity();
        disc.setId(new QuizQuestionDiscriminationEntity.Id(quizId, quizVersionId, 100));
        disc.setDiscNorm(new java.math.BigDecimal("0.250000"));
        disc.setDiscQuality("ok");
        disc.setAttemptsSubmitted(80);

        when(discRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(List.of(disc));

        Workbook wb = workbook(service.exportQuizAnalyticsDetailedExcel(quizId, quizVersionId));

        Sheet sAvg = wb.getSheet("detailed_avg_choice");
        Sheet sDist = wb.getSheet("detailed_option_distribution");
        Sheet sDisc = wb.getSheet("detailed_discrimination");

        assertThat(sAvg).isNotNull();
        assertThat(sDist).isNotNull();
        assertThat(sDisc).isNotNull();

        // avg choice row
        assertThat(cell(sAvg, 1, 0)).isEqualTo("100");
        assertThat(cell(sAvg, 1, 1)).isEqualTo("1");
        assertThat(cell(sAvg, 1, 2)).isEqualTo("2.5000");
        assertThat(cell(sAvg, 1, 3)).isEqualTo("40");

        // dist row
        assertThat(cell(sDist, 1, 0)).isEqualTo("100");
        assertThat(cell(sDist, 1, 2)).isEqualTo("1000");

        // disc row
        assertThat(cell(sDisc, 1, 0)).isEqualTo("100");
        assertThat(cell(sDisc, 1, 1)).isEqualTo("0.250000");
        assertThat(cell(sDisc, 1, 2)).isEqualTo("ok");
        assertThat(cell(sDisc, 1, 3)).isEqualTo("80");
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
