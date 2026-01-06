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
import com.diploma.proforientation.service.QuestionService;
import com.diploma.proforientation.util.LocaleProvider;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.diploma.proforientation.util.Constants.*;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepo;
    private final QuizVersionRepository quizVersionRepo;
    private final QuestionOptionRepository optionRepo;
    private final TranslationResolver translationResolver;
    private final LocaleProvider localeProvider;

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
            Pageable pageable
    ) {
        String locale = localeProvider.currentLanguage();

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
            Pageable pageable
    ) {
        String locale = localeProvider.currentLanguage();

        QuizVersion version = quizVersionRepo
                .findByQuizIdAndVersion(quizId, versionNum)
                .orElseThrow(() -> new RuntimeException(QUIZ_VERSION_NOT_FOUND));

        return loadQuestions(version.getId(), locale, pageable);
    }

    @Override
    public List<OptionDto> getOptionsForQuestionLocalized(
            Integer questionId
    ) {
        String locale = localeProvider.currentLanguage();

        questionRepo.findById(questionId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Question not found")
                );

        List<QuestionOption> options =
                optionRepo.findByQuestionIdOrderByOrdAsc(questionId);

        return options.stream()
                .map(option -> optionToDto(option, locale))
                .toList();
    }

    private OptionDto optionToDto(QuestionOption option, String locale) {
        String label = translationResolver.resolve(
                ENTITY_TYPE_OPTION,
                option.getId(),
                FIELD_TEXT,
                locale,
                option.getLabelDefault()
        );

        return new OptionDto(
                option.getId(),
                option.getQuestion().getId(),
                option.getOrd(),
                label
        );
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
                q.getQtype().toString(),
                q.getTextDefault(),
                List.of()
        );
    }

    private QuestionDto toLocalizedDto(Question q, String locale) {

        String localized = translationResolver.resolve(
                ENTITY_TYPE_QUESTION,
                q.getId(),
                FIELD_TEXT,
                locale,
                q.getTextDefault()
        );

        List<QuestionOption> options =
                optionRepo.findByQuestionIdOrderByOrd(q.getId());

        List<OptionDto> optionDtos = options.stream()
                .map(opt -> optionToDto(opt, locale))
                .toList();

        return new QuestionDto(
                q.getId(),
                q.getQuizVersion().getId(),
                q.getOrd(),
                q.getQtype().toString(),
                localized,
                optionDtos
        );
    }
}