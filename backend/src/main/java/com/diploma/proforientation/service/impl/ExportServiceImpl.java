package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.service.ExportService;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.*;
import com.opencsv.CSVWriter;
import com.opencsv.ICSVWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;

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

    @Override
    public byte[] exportEntityToCsv(String entity) {

        try (
                StringWriter sw = new StringWriter();
                CSVWriter writer = new CSVWriter(sw,
                        ICSVWriter.DEFAULT_SEPARATOR,
                        ICSVWriter.NO_QUOTE_CHARACTER,
                        ICSVWriter.DEFAULT_ESCAPE_CHARACTER,
                        ICSVWriter.DEFAULT_LINE_END)
        ) {

            switch (entity) {

                case ENTITY_QUIZZES -> {
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

                case ENTITY_QUIZ_VERSIONS -> {
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

                case ENTITY_QUESTIONS -> {
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

                case ENTITY_QUESTION_OPTIONS -> {
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

                case ENTITY_PROFESSIONS -> {
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

                case ENTITY_ATTEMPTS -> {
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

                case ENTITY_TRANSLATIONS -> {
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

                default -> throw new IllegalArgumentException(
                        UNSUPPORTED_EXPORT_ENTITY + entity
                );
            }

            writer.flush();
            return sw.toString().getBytes(StandardCharsets.UTF_8);

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(CSV_EXPORT_FAILED + entity, e);
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

        } catch (Exception e) {
            throw new RuntimeException(EXCEL_EXPORT_FAILED, e);
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
}