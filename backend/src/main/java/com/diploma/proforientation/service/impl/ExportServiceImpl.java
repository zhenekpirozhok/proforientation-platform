package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.QuizMetricsFilter;
import com.diploma.proforientation.exception.CsvExportException;
import com.diploma.proforientation.exception.ExcelExportException;
import com.diploma.proforientation.repository.spec.QuizPublicMetricsSpecs;
import com.diploma.proforientation.service.ExportService;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.*;
import com.opencsv.CSVWriter;
import com.opencsv.ICSVWriter;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Consumer;

import static com.diploma.proforientation.util.Constants.*;

@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements ExportService {

    private final QuizRepository quizRepo;
    private final QuizVersionRepository quizVersionRepo;
    private final QuestionRepository questionRepo;
    private final QuestionOptionRepository optionRepo;
    private final ProfessionRepository professionRepo;
    private final AttemptRepository attemptRepo;
    private final TranslationRepository translationRepo;
    private final QuizPublicMetricsRepository quizPublicMetricsRepo;

    private final Map<String, Consumer<CSVWriter>> csvExporters = new LinkedHashMap<>();

    @PostConstruct
    public void initExporters() {
        csvExporters.put(ENTITY_QUIZZES, this::writeQuizzesCsv);
        csvExporters.put(ENTITY_QUIZ_VERSIONS, this::writeQuizVersionsCsv);
        csvExporters.put(ENTITY_QUESTIONS, this::writeQuestionsCsv);
        csvExporters.put(ENTITY_QUESTION_OPTIONS, this::writeOptionsCsv);
        csvExporters.put(ENTITY_PROFESSIONS, this::writeProfessionsCsv);
        csvExporters.put(ENTITY_ATTEMPTS, this::writeAttemptsCsv);
        csvExporters.put(ENTITY_TRANSLATIONS, this::writeTranslationsCsv);
    }

    @Override
    public byte[] exportEntityToCsv(String entity) {
        Consumer<CSVWriter> exporter = csvExporters.get(entity);

        if (exporter == null) {
            throw new CsvExportException(UNSUPPORTED_EXPORT_ENTITY + entity);
        }

        try (StringWriter sw = new StringWriter();
             CSVWriter writer = new CSVWriter(
                     sw,
                     ICSVWriter.DEFAULT_SEPARATOR,
                     ICSVWriter.NO_QUOTE_CHARACTER,
                     ICSVWriter.DEFAULT_ESCAPE_CHARACTER,
                     ICSVWriter.DEFAULT_LINE_END
             )) {

            exporter.accept(writer);
            writer.flush();

            return sw.toString().getBytes(StandardCharsets.UTF_8);

        } catch (IOException | RuntimeException e) {
            throw new CsvExportException(CSV_EXPORT_FAILED + entity, e);
        }
    }

    @Override
    public byte[] exportAllToExcel() {
        try (Workbook wb = new XSSFWorkbook()) {

            writeQuizzes(wb);
            writeQuizVersions(wb);
            writeQuestions(wb);
            writeOptions(wb);
            writeProfessions(wb);
            writeAttempts(wb);
            writeTranslations(wb);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();

        } catch (IOException | RuntimeException e){
            throw new ExcelExportException(EXCEL_EXPORT_FAILED, e);
        }
    }

    @Override
    public byte[] exportQuizMetricsToCsv(QuizMetricsFilter filter) {
        try (StringWriter sw = new StringWriter();
             CSVWriter writer = new CSVWriter(
                     sw,
                     ICSVWriter.DEFAULT_SEPARATOR,
                     ICSVWriter.NO_QUOTE_CHARACTER,
                     ICSVWriter.DEFAULT_ESCAPE_CHARACTER,
                     ICSVWriter.DEFAULT_LINE_END
             )) {

            writer.writeNext(HEADERS_QUIZ_PUBLIC_METRICS);

            var rows = quizPublicMetricsRepo.findAll(QuizPublicMetricsSpecs.byFilter(filter));
            for (var e : rows) {
                writer.writeNext(new String[]{
                        stringValue(e.getQuizId()),
                        stringValue(e.getQuizCode()),
                        stringValue(e.getQuizStatus()),
                        stringValue(e.getCategoryId()),
                        stringValue(e.getQuestionsTotal()),
                        stringValue(e.getAttemptsTotal()),
                        stringValue(e.getAttemptsSubmitted()),
                        stringValue(e.getAvgDurationSeconds()),
                        stringValue(e.getEstimatedDurationSeconds())
                });
            }

            writer.flush();
            return sw.toString().getBytes(StandardCharsets.UTF_8);

        } catch (IOException | RuntimeException ex) {
            throw new CsvExportException(CSV_EXPORT_FAILED + ENTITY_QUIZ_PUBLIC_METRICS, ex);
        }
    }

    @Override
    public byte[] exportQuizMetricsToExcel(QuizMetricsFilter filter) {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet s = wb.createSheet(ENTITY_QUIZ_PUBLIC_METRICS);
            row(s, 0, (Object[]) HEADERS_QUIZ_PUBLIC_METRICS);

            int r = 1;
            var rows = quizPublicMetricsRepo.findAll(QuizPublicMetricsSpecs.byFilter(filter));
            for (var e : rows) {
                row(s, r++,
                        e.getQuizId(),
                        e.getQuizCode(),
                        e.getQuizStatus(),
                        e.getCategoryId(),
                        e.getQuestionsTotal(),
                        e.getAttemptsTotal(),
                        e.getAttemptsSubmitted(),
                        e.getAvgDurationSeconds(),
                        e.getEstimatedDurationSeconds()
                );
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();

        } catch (IOException | RuntimeException ex) {
            throw new ExcelExportException(EXCEL_EXPORT_FAILED + ENTITY_QUIZ_PUBLIC_METRICS, ex);
        }
    }

    private void writeQuizzes(Workbook wb) {
        Sheet s = wb.createSheet(ENTITY_QUIZZES);
        row(s, 0, (Object[]) HEADERS_QUIZZES);

        int r = 1;
        for (Quiz q : quizRepo.findAll()) {
            row(s, r++,
                    q.getId(),
                    q.getCode(),
                    q.getTitleDefault(),
                    q.getDescriptionDefault(),
                    q.getStatus(),
                    q.getProcessingMode(),
                    q.getCategory().getId(),
                    q.getAuthor().getId(),
                    q.getSecondsPerQuestionDefault()
            );
        }
    }

    private void writeQuizVersions(Workbook wb) {
        Sheet s = wb.createSheet(ENTITY_QUIZ_VERSIONS);
        row(s, 0, (Object[]) HEADERS_QUIZ_VERSIONS);

        int r = 1;
        for (QuizVersion v : quizVersionRepo.findAll()) {
            row(s, r++,
                    v.getId(),
                    v.getQuiz().getId(),
                    v.getVersion(),
                    v.isCurrent(),
                    v.getPublishedAt()
            );
        }
    }

    private void writeQuestions(Workbook wb) {
        Sheet s = wb.createSheet(ENTITY_QUESTIONS);
        row(s, 0, (Object[]) HEADERS_QUESTIONS);

        int r = 1;
        for (Question q : questionRepo.findAll()) {
            row(s, r++,
                    q.getId(),
                    q.getQuizVersion().getId(),
                    q.getOrd(),
                    q.getQtype(),
                    q.getTextDefault()
            );
        }
    }

    private void writeOptions(Workbook wb) {
        Sheet s = wb.createSheet(ENTITY_QUESTION_OPTIONS);
        row(s, 0, (Object[]) HEADERS_QUESTION_OPTIONS);

        int r = 1;
        for (QuestionOption o : optionRepo.findAll()) {
            row(s, r++,
                    o.getId(),
                    o.getQuestion().getId(),
                    o.getOrd(),
                    o.getLabelDefault()
            );
        }
    }

    private void writeProfessions(Workbook wb) {
        Sheet s = wb.createSheet(ENTITY_PROFESSIONS);
        row(s, 0, (Object[]) HEADERS_PROFESSIONS);

        int r = 1;
        for (Profession p : professionRepo.findAll()) {
            row(s, r++,
                    p.getId(),
                    p.getCode(),
                    p.getTitleDefault(),
                    p.getDescription(),
                    p.getMlClassCode(),
                    p.getCategory().getId()
            );
        }
    }

    private void writeAttempts(Workbook wb) {
        Sheet s = wb.createSheet(ENTITY_ATTEMPTS);
        row(s, 0, (Object[]) HEADERS_ATTEMPTS);

        int r = 1;
        for (Attempt a : attemptRepo.findAll()) {
            row(s, r++,
                    a.getId(),
                    a.getQuizVersion().getId(),
                    a.getUser() != null ? a.getUser().getId() : null,
                    a.getGuestToken(),
                    a.getLocale(),
                    a.getStartedAt(),
                    a.getSubmittedAt(),
                    a.getUuid()
            );
        }
    }

    private void writeTranslations(Workbook wb) {
        Sheet s = wb.createSheet(ENTITY_TRANSLATIONS);
        row(s, 0, (Object[]) HEADERS_TRANSLATIONS);

        int r = 1;
        for (Translation t : translationRepo.findAll()) {
            row(s, r++,
                    t.getId(),
                    t.getEntityType(),
                    t.getEntityId(),
                    t.getLocale(),
                    t.getField(),
                    t.getText()
            );
        }
    }

    private void row(Sheet s, int rowNum, Object... values) {
        Row row = s.createRow(rowNum);
        for (int i = 0; i < values.length; i++) {
            org.apache.poi.ss.usermodel.Cell c = row.createCell(i);
            if (values[i] != null) {
                c.setCellValue(values[i].toString());
            }
        }
    }

    private String stringValue(Object o) {
        return o == null ? EMPTY_STRING : o.toString();
    }

    private void writeQuizzesCsv(CSVWriter writer) {
        writer.writeNext(HEADERS_QUIZZES);

        for (Quiz q : quizRepo.findAll()) {
            writer.writeNext(new String[]{
                    stringValue(q.getId()),
                    q.getCode(),
                    q.getTitleDefault(),
                    q.getDescriptionDefault(),
                    q.getStatus().name(),
                    q.getProcessingMode().name(),
                    stringValue(q.getCategory().getId()),
                    stringValue(q.getAuthor().getId()),
                    stringValue(q.getSecondsPerQuestionDefault())
            });
        }
    }

    private void writeAttemptsCsv(CSVWriter writer) {
        writer.writeNext(HEADERS_ATTEMPTS);

        for (Attempt a : attemptRepo.findAll()) {
            writer.writeNext(new String[]{
                    stringValue(a.getId()),
                    stringValue(a.getQuizVersion().getId()),
                    a.getUser() != null ? stringValue(a.getUser().getId()) : EMPTY_STRING,
                    a.getGuestToken(),
                    a.getLocale(),
                    stringValue(a.getStartedAt()),
                    stringValue(a.getSubmittedAt()),
                    stringValue(a.getUuid())
            });
        }
    }

    private void writeQuizVersionsCsv(CSVWriter writer) {
        writer.writeNext(HEADERS_QUIZ_VERSIONS);

        for (QuizVersion v : quizVersionRepo.findAll()) {
            writer.writeNext(new String[]{
                    stringValue(v.getId()),
                    stringValue(v.getQuiz().getId()),
                    stringValue(v.getVersion()),
                    String.valueOf(v.isCurrent()),
                    stringValue(v.getPublishedAt())
            });
        }
    }

    private void writeQuestionsCsv(CSVWriter writer) {
        writer.writeNext(HEADERS_QUESTIONS);

        for (Question q : questionRepo.findAll()) {
            writer.writeNext(new String[]{
                    stringValue(q.getId()),
                    stringValue(q.getQuizVersion().getId()),
                    stringValue(q.getOrd()),
                    q.getQtype().name(),
                    q.getTextDefault()
            });
        }
    }

    private void writeOptionsCsv(CSVWriter writer) {
        writer.writeNext(HEADERS_QUESTION_OPTIONS);

        for (QuestionOption o : optionRepo.findAll()) {
            writer.writeNext(new String[]{
                    stringValue(o.getId()),
                    stringValue(o.getQuestion().getId()),
                    stringValue(o.getOrd()),
                    o.getLabelDefault()
            });
        }
    }

    private void writeProfessionsCsv(CSVWriter writer) {
        writer.writeNext(HEADERS_PROFESSIONS);

        for (Profession p : professionRepo.findAll()) {
            writer.writeNext(new String[]{
                    stringValue(p.getId()),
                    p.getCode(),
                    p.getTitleDefault(),
                    p.getDescription(),
                    p.getMlClassCode(),
                    stringValue(p.getCategory().getId())
            });
        }
    }

    private void writeTranslationsCsv(CSVWriter writer) {
        writer.writeNext(HEADERS_TRANSLATIONS);

        for (Translation t : translationRepo.findAll()) {
            writer.writeNext(new String[]{
                    stringValue(t.getId()),
                    t.getEntityType(),
                    stringValue(t.getEntityId()),
                    t.getLocale(),
                    t.getField(),
                    t.getText()
            });
        }
    }
}