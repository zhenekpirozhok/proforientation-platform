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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.diploma.proforientation.service.impl.OptionServiceImpl.ENTITY_TYPE_OPTION;
import static com.diploma.proforientation.service.impl.OptionServiceImpl.FIELD_TEXT;
import static com.diploma.proforientation.util.ErrorMessages.QUESTION_NOT_FOUND;
import static com.diploma.proforientation.util.ErrorMessages.QUIZ_VERSION_NOT_FOUND;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private static final String ENTITY_TYPE_QUESTION = "question";

    private final QuestionRepository questionRepo;
    private final QuizVersionRepository quizVersionRepo;
    private final QuestionOptionRepository optionRepo;
    private final TranslationRepository translationRepo;

    @Override
    @Transactional
    public QuestionDto create(CreateQuestionRequest req) {
        QuizVersion version = quizVersionRepo.findById(req.quizVersionId())
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_VERSION_NOT_FOUND));

        Question q = new Question();
        q.setQuizVersion(version);
        q.setOrd(req.ord());
        q.setQtype(Enum.valueOf(QuestionType.class, req.qtype()));
        q.setTextDefault(req.text());

        return toDto(questionRepo.save(q));
    }

    @Override
    @Transactional
    public QuestionDto update(Integer id, UpdateQuestionRequest req) {
        Question q = questionRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(QUESTION_NOT_FOUND));

        if (req.ord() != null) q.setOrd(req.ord());
        if (req.qtype() != null) q.setQtype(Enum.valueOf(QuestionType.class, req.qtype()));
        if (req.text() != null) q.setTextDefault(req.text());

        return toDto(questionRepo.save(q));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        questionRepo.deleteById(id);
    }

    @Override
    public QuestionDto updateOrder(Integer id, Integer ord) {
        Question q = questionRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(QUESTION_NOT_FOUND));

        q.setOrd(ord);
        return toDto(questionRepo.save(q));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuestionDto> getQuestionsForCurrentVersion(
            Integer quizId,
            String locale,
            Pageable pageable
    ) {
        QuizVersion version = quizVersionRepo
                .findByQuizIdAndCurrentTrue(quizId)
                .orElseThrow(() -> new RuntimeException(QUIZ_VERSION_NOT_FOUND));

        return loadQuestions(version.getId(), locale, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuestionDto> getQuestionsForVersion(
            Integer quizId,
            Integer versionNum,
            String locale,
            Pageable pageable
    ) {
        QuizVersion version = quizVersionRepo
                .findByQuizIdAndVersion(quizId, versionNum)
                .orElseThrow(() -> new RuntimeException(QUIZ_VERSION_NOT_FOUND));

        return loadQuestions(version.getId(), locale, pageable);
    }

    private Page<QuestionDto> loadQuestions(
            Integer quizVersionId,
            String locale,
            Pageable pageable
    ) {
        return questionRepo
                .findByQuizVersionIdOrderByOrd(quizVersionId, pageable)
                .map(q -> toLocalizedDto(q, locale));
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
                .findByEntityTypeAndEntityIdAndFieldAndLocale(ENTITY_TYPE_QUESTION, q.getId(),
                        FIELD_TEXT, locale)
                .map(t -> t.getText())
                .orElse(q.getTextDefault());

        List<QuestionOption> options = optionRepo.findByQuestionIdOrderByOrd(q.getId());

        List<OptionDto> optionDtos = options.stream()
                .map(opt -> {
                    String label = translationRepo
                            .findByEntityTypeAndEntityIdAndFieldAndLocale(ENTITY_TYPE_OPTION, opt.getId(),
                                    FIELD_TEXT, locale)
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