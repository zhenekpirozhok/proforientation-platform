package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.model.QuizVersion;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.repository.QuestionOptionRepository;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.repository.QuizVersionRepository;
import com.diploma.proforientation.repository.TranslationRepository;
import com.diploma.proforientation.service.QuestionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepo;
    private final QuizVersionRepository quizVersionRepo;
    private final QuestionOptionRepository optionRepo;
    private final TranslationRepository translationRepo;

    @Override
    public QuestionDto create(CreateQuestionRequest req) {
        QuizVersion version = quizVersionRepo.findById(req.quizVersionId())
                .orElseThrow(() -> new EntityNotFoundException("Quiz version not found"));

        Question q = new Question();
        q.setQuizVersion(version);
        q.setOrd(req.ord());
        q.setQtype(Enum.valueOf(QuestionType.class, req.qtype()));
        q.setTextDefault(req.text());

        return toDto(questionRepo.save(q));
    }

    @Override
    public QuestionDto update(Integer id, UpdateQuestionRequest req) {
        Question q = questionRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Question not found"));

        if (req.ord() != null) q.setOrd(req.ord());
        if (req.qtype() != null) q.setQtype(Enum.valueOf(QuestionType.class, req.qtype()));
        if (req.text() != null) q.setTextDefault(req.text());

        return toDto(questionRepo.save(q));
    }

    @Override
    public void delete(Integer id) {
        questionRepo.deleteById(id);
    }

    @Override
    public QuestionDto updateOrder(Integer id, Integer ord) {
        Question q = questionRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Question not found"));

        q.setOrd(ord);
        return toDto(questionRepo.save(q));
    }

    @Override
    public List<QuestionDto> getQuestionsForCurrentVersion(Integer quizId, String locale) {
        QuizVersion version = quizVersionRepo.findByQuizIdAndCurrentTrue(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz version not found"));

        return loadQuestions(version.getId(), locale);
    }

    @Override
    public List<QuestionDto> getQuestionsForVersion(Integer quizId, Integer versionNum, String locale) {
        QuizVersion version = quizVersionRepo.findByQuizIdAndVersion(quizId, versionNum)
                .orElseThrow(() -> new RuntimeException("Quiz version not found"));

        return loadQuestions(version.getId(), locale);
    }

    private List<QuestionDto> loadQuestions(Integer qvId, String locale) {
        return questionRepo.findByQuizVersionIdOrderByOrd(qvId).stream()
                .map(q -> toLocalizedDto(q, locale))
                .toList();
    }

    private QuestionDto toDto(Question q) {
        return new QuestionDto(
                q.getId(),
                q.getQuizVersion().getId(),
                q.getOrd(),
                q.getQtype().name(),
                q.getTextDefault(),
                List.of()
        );
    }

    private QuestionDto toLocalizedDto(Question q, String locale) {

        String localized = translationRepo
                .findByEntityTypeAndEntityIdAndFieldAndLocale("question", q.getId(), "text", locale)
                .map(t -> t.getText())
                .orElse(q.getTextDefault());

        List<QuestionOption> options = optionRepo.findByQuestionIdOrderByOrd(q.getId());

        List<OptionDto> optionDtos = options.stream()
                .map(opt -> {
                    String label = translationRepo
                            .findByEntityTypeAndEntityIdAndFieldAndLocale("question_option", opt.getId(), "text", locale)
                            .map(t -> t.getText())
                            .orElse(opt.getLabelDefault());

                    return new OptionDto(
                            opt.getId(),
                            opt.getQuestion().getId(),
                            opt.getOrd(),
                            label
                    );
                })
                .toList();

        return new QuestionDto(
                q.getId(),
                q.getQuizVersion().getId(),
                q.getOrd(),
                q.getQtype().name(),
                localized,
                optionDtos
        );
    }
}