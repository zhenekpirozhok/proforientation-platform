package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.model.Quiz;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.repository.QuizPublicMetricsRepository;
import com.diploma.proforientation.repository.QuizRepository;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.QuizService;
import com.diploma.proforientation.util.LocaleProvider;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.criteria.Predicate;

import static com.diploma.proforientation.util.Constants.*;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private static final String STATUS_FIELD = "status";
    private static final String ID_FIELD = "id";
    private static final String CATEGORY_FIELD = "category";
    private static final String TITLE_FIELD = "titleDefault";
    private static final String CODE_FIELD = "code";
    private static final String DESCRIPTION_FIELD = "descriptionDefault";

    private final QuizRepository quizRepo;
    private final ProfessionCategoryRepository categoryRepo;
    private final UserRepository userRepo;
    private final TranslationResolver translationResolver;
    private final LocaleProvider localeProvider;
    private final QuizPublicMetricsRepository quizPublicMetricsRepo;

    @Transactional(readOnly = true)
    @Override
    public Page<QuizDto> getAll(Pageable pageable) {
        return quizRepo.findAll(pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<QuizDto> getAllLocalized(Pageable pageable) {
        String locale = localeProvider.currentLanguage();
        return quizRepo.findAll(pageable)
                .map(q -> toDtoLocalized(q, locale));
    }

    @Override
    public QuizDto getById(Integer id) {
        return quizRepo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_NOT_FOUND));
    }

    public QuizDto getByIdLocalized(Integer id) {
        String locale = localeProvider.currentLanguage();
        Quiz quiz = quizRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_NOT_FOUND));
        return toDtoLocalized(quiz, locale);
    }

    public QuizDto getByCodeLocalized(String code) {
        String locale = localeProvider.currentLanguage();
        Quiz quiz = quizRepo.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_CODE_NOT_FOUND + code));
        return toDtoLocalized(quiz, locale);
    }

    @Override
    @Transactional
    public QuizDto create(CreateQuizRequest req) {
        ProfessionCategory category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new EntityNotFoundException(CATEGORY_NOT_FOUND));

        User author = userRepo.findById(req.authorId())
                .orElseThrow(() -> new EntityNotFoundException(AUTHOR_NOT_FOUND));

        Quiz q = new Quiz();
        q.setCode(req.code());
        q.setTitleDefault(req.title());
        q.setProcessingMode(req.processingMode() != null
                ? Enum.valueOf(QuizProcessingMode.class, req.processingMode())
                : QuizProcessingMode.LLM);
        q.setStatus(req.status() != null
                ? QuizStatus.valueOf(req.status())
                : QuizStatus.DRAFT);
        q.setDescriptionDefault(req.descriptionDefault());
        if (req.secondsPerQuestionDefault() != null) {
            if (req.secondsPerQuestionDefault() <= 0) {
                throw new IllegalArgumentException(SECONDS_COUNT_SHOULD_BE_GRATER_THEN_ZERO);
            }
            q.setSecondsPerQuestionDefault(req.secondsPerQuestionDefault());
        }
        q.setCategory(category);
        q.setAuthor(author);
        q.setCreatedAt(Instant.now());
        q.setUpdatedAt(Instant.now());

        return toDto(quizRepo.save(q));
    }

    @Override
    @Transactional
    public QuizDto update(Integer id, UpdateQuizRequest req) {
        Quiz q = quizRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_NOT_FOUND));

        if (req.title() != null) {
            q.setTitleDefault(req.title());
        }

        if (req.processingMode() != null) {
            q.setProcessingMode(Enum.valueOf(QuizProcessingMode.class,
                    req.processingMode()
            ));
        }
        if (req.status() != null) {
            q.setStatus(QuizStatus.valueOf(req.status()));
        }

        if (req.descriptionDefault() != null) {
            q.setDescriptionDefault(req.descriptionDefault());
        }

        if (req.secondsPerQuestionDefault() != null) {
            if (req.secondsPerQuestionDefault() <= 0) {
                throw new IllegalArgumentException(SECONDS_COUNT_SHOULD_BE_GRATER_THEN_ZERO);
            }
            q.setSecondsPerQuestionDefault(req.secondsPerQuestionDefault());
        }

        if (req.categoryId() != null) {
            ProfessionCategory category = categoryRepo.findById(req.categoryId())
                    .orElseThrow(() -> new EntityNotFoundException(CATEGORY_NOT_FOUND));
            q.setCategory(category);
        }

        q.setUpdatedAt(Instant.now());

        return toDto(quizRepo.save(q));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Quiz quiz = quizRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_NOT_FOUND));
        quizRepo.delete(quiz);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuizDto> search(
            String search,
            Integer categoryId,
            Integer minDurationSec,
            Integer maxDurationSec,
            Pageable pageable
    ) {
        String locale = localeProvider.currentLanguage();

        boolean hasDurationFilter = minDurationSec != null || maxDurationSec != null;

        final List<Integer> durationQuizIds =
                (minDurationSec != null || maxDurationSec != null)
                        ? quizPublicMetricsRepo.findQuizIdsByDuration(minDurationSec, maxDurationSec)
                        : null;

        if (durationQuizIds != null && durationQuizIds.isEmpty()) {
            return Page.empty(pageable);
        }

        Specification<Quiz> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get(STATUS_FIELD), QuizStatus.PUBLISHED));

            if (search != null && !search.isBlank()) {
                String like = PERCENT + search.trim().toLowerCase() + PERCENT;
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get(TITLE_FIELD)), like),
                        cb.like(cb.lower(root.get(CODE_FIELD)), like),
                        cb.like(cb.lower(root.get(DESCRIPTION_FIELD)), like)
                ));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get(CATEGORY_FIELD).get(ID_FIELD), categoryId));
            }

            if (hasDurationFilter) {
                predicates.add(root.get(ID_FIELD).in(durationQuizIds));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return quizRepo.findAll(spec, pageable)
                .map(q -> toDtoLocalized(q, locale));
    }

    private QuizDto toDto(Quiz q) {
        return new QuizDto(
                q.getId(),
                q.getCode(),
                q.getTitleDefault(),
                q.getStatus().name(),
                q.getProcessingMode().name(),
                q.getCategory() != null ? q.getCategory().getId() : null,
                q.getAuthor() != null ? q.getAuthor().getId() : null,
                q.getDescriptionDefault(),
                q.getSecondsPerQuestionDefault()
        );
    }

    private QuizDto toDtoLocalized(Quiz q, String locale) {

        String title = translationResolver.resolve(
                ENTITY_TYPE_QUIZ,
                q.getId(),
                FIELD_TITLE,
                locale,
                q.getTitleDefault()
        );

        String description = translationResolver.resolve(
                ENTITY_TYPE_QUIZ,
                q.getId(),
                FIELD_DESCRIPTION,
                locale,
                q.getDescriptionDefault()
        );

        return new QuizDto(
                q.getId(),
                q.getCode(),
                title,
                q.getStatus().name(),
                q.getProcessingMode().name(),
                q.getCategory().getId(),
                q.getAuthor().getId(),
                description,
                q.getSecondsPerQuestionDefault()
        );
    }
}