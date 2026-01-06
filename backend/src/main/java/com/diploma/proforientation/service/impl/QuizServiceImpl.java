package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import com.diploma.proforientation.model.ProfessionCategory;
import com.diploma.proforientation.model.Quiz;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.repository.ProfessionCategoryRepository;
import com.diploma.proforientation.repository.QuizRepository;
import com.diploma.proforientation.repository.UserRepository;
import com.diploma.proforientation.service.QuizService;
import com.diploma.proforientation.util.LocaleProvider;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    private final QuizRepository quizRepo;
    private final ProfessionCategoryRepository categoryRepo;
    private final UserRepository userRepo;
    private final TranslationResolver translationResolver;
    private final LocaleProvider localeProvider;

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
                .orElseThrow(() -> new EntityNotFoundException("Quiz not found with code: " + code));
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

    @Transactional(readOnly = true)
    @Override
    public Page<QuizDto> searchAndSort(
            String search,      // search by title/code/description
            String sortBy,      // "category", "createdAt", "updatedAt", default "id"
            Pageable pageable
    ) {
        String locale = localeProvider.currentLanguage();
        Specification<Quiz> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("titleDefault")), like),
                        cb.like(cb.lower(root.get("code")), like),
                        cb.like(cb.lower(root.get("descriptionDefault")), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Sorting
        if ("category".equals(sortBy)) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by("category.id").ascending());
        } else if ("createdAt".equals(sortBy)) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by("createdAt").descending());
        } else if ("updatedAt".equals(sortBy)) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by("updatedAt").descending());
        }

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