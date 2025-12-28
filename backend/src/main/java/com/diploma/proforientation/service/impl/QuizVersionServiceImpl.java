package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.QuizVersionDto;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.QuizVersionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static com.diploma.proforientation.util.Constants.*;

@Service
@RequiredArgsConstructor
public class QuizVersionServiceImpl implements QuizVersionService {

    private final QuizRepository quizRepo;
    private final QuizVersionRepository versionRepo;
    private final QuestionRepository questionRepo;
    private final QuestionOptionRepository optionRepo;

    @Override
    @Transactional
    public QuizVersionDto publishQuiz(Integer quizId) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_NOT_FOUND));

        QuizVersion latest = versionRepo.findTopByQuizIdOrderByVersionDesc(quizId).orElse(null);
        int newVersionNumber = latest != null ? latest.getVersion() + 1 : 1;

        if (latest != null) {
            latest.setCurrent(false);
            versionRepo.save(latest);
        }

        QuizVersion newVersion = new QuizVersion();
        newVersion.setQuiz(quiz);
        newVersion.setVersion(newVersionNumber);
        newVersion.setCurrent(true);
        newVersion.setPublishedAt(Instant.now());
        newVersion = versionRepo.save(newVersion);

        if (latest != null) {
            copyQuestionsAndOptions(latest, newVersion);
        }

        return toDto(newVersion);
    }

    @Override
    @Transactional
    public QuizVersionDto copyLatestVersion(Integer quizId) {
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_NOT_FOUND));

        QuizVersion latest = versionRepo.findTopByQuizIdOrderByVersionDesc(quizId)
                .orElseThrow(() -> new EntityNotFoundException(NO_QUIZ_VERSIONS));

        int newVersionNumber = latest.getVersion() + 1;

        QuizVersion copy = new QuizVersion();
        copy.setQuiz(quiz);
        copy.setVersion(newVersionNumber);
        copy.setCurrent(false);
        copy.setPublishedAt(null);
        copy = versionRepo.save(copy);

        copyQuestionsAndOptions(latest, copy);

        return toDto(copy);
    }

    private void copyQuestionsAndOptions(QuizVersion source, QuizVersion target) {
        List<Question> questions = questionRepo.findByQuizVersionId(source.getId());

        for (Question q : questions) {
            Question newQ = new Question();
            newQ.setQuizVersion(target);
            newQ.setOrd(q.getOrd());
            newQ.setQtype(q.getQtype());
            newQ.setTextDefault(q.getTextDefault());
            newQ = questionRepo.save(newQ);

            List<QuestionOption> opts = optionRepo.findByQuestionId(q.getId());
            for (QuestionOption opt : opts) {
                QuestionOption newOpt = new QuestionOption();
                newOpt.setQuestion(newQ);
                newOpt.setOrd(opt.getOrd());
                newOpt.setLabelDefault(opt.getLabelDefault());
                optionRepo.save(newOpt);
            }
        }
    }

    @Override
    public List<QuizVersionDto> getVersionsForQuiz(Integer quizId) {
        return versionRepo.findByQuizIdOrderByVersionDesc(quizId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public QuizVersionDto getCurrentVersion(Integer quizId) {
        QuizVersion v = versionRepo
                .findByQuizIdAndCurrentTrue(quizId)
                .orElseThrow(() -> new RuntimeException(CURRENT_QUIZ_VERSION_NOT_FOUND));

        return toDto(v);
    }

    @Override
    public QuizVersionDto getVersion(Integer quizId, Integer version) {
        QuizVersion v = versionRepo
                .findByQuizIdAndVersion(quizId, version)
                .orElseThrow(() -> new RuntimeException(QUIZ_VERSION_NOT_FOUND));

        return toDto(v);
    }

    private QuizVersionDto toDto(QuizVersion v) {
        return new QuizVersionDto(
                v.getId(),
                v.getQuiz().getId(),
                v.getVersion(),
                v.isCurrent(),
                v.getPublishedAt()
        );
    }
}