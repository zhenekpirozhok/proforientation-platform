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
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

import static com.diploma.proforientation.service.impl.ProfessionServiceImpl.FIELD_TITLE;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private static final String ENTITY_TYPE_QUIZ = "quiz";

    private final QuizRepository quizRepo;
    private final ProfessionCategoryRepository categoryRepo;
    private final UserRepository userRepo;
    private final TranslationResolver translationResolver;

    @Override
    public List<QuizDto> getAll() {
        return quizRepo.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public QuizDto getById(Integer id) {
        return quizRepo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Quiz not found"));
    }

    public List<QuizDto> getAllLocalized(String locale) {
        return quizRepo.findAll().stream()
                .map(q -> toDtoLocalized(q, locale))
                .toList();
    }

    public QuizDto getByIdLocalized(Integer id, String locale) {
        Quiz quiz = quizRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quiz not found"));
        return toDtoLocalized(quiz, locale);
    }

    @Override
    public QuizDto create(CreateQuizRequest req) {
        ProfessionCategory category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));

        User author = userRepo.findById(req.authorId())
                .orElseThrow(() -> new EntityNotFoundException("Author not found"));

        Quiz q = new Quiz();
        q.setCode(req.code());
        q.setTitleDefault(req.title());
        q.setProcessingMode(req.processingMode() != null
                ? Enum.valueOf(QuizProcessingMode.class, req.processingMode())
                : QuizProcessingMode.llm);
        q.setCategory(category);
        q.setAuthor(author);
        q.setCreatedAt(Instant.now());
        q.setUpdatedAt(Instant.now());

        return toDto(quizRepo.save(q));
    }

    @Override
    public QuizDto update(Integer id, UpdateQuizRequest req) {
        Quiz q = quizRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quiz not found"));

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
                    .orElseThrow(() -> new EntityNotFoundException("Category not found"));
            q.setCategory(category);
        }

        q.setUpdatedAt(Instant.now());

        return toDto(quizRepo.save(q));
    }

    @Override
    public void delete(Integer id) {
        Quiz quiz = quizRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quiz not found"));
        quizRepo.delete(quiz);
    }

    private QuizDto toDto(Quiz q) {
        return new QuizDto(
                q.getId(),
                q.getCode(),
                q.getTitleDefault(),
                q.getStatus().name(),
                q.getProcessingMode().name(),
                q.getCategory() != null ? q.getCategory().getId() : null,
                q.getAuthor() != null ? q.getAuthor().getId() : null
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

        return new QuizDto(
                q.getId(),
                q.getCode(),
                title,
                q.getStatus().name(),
                q.getProcessingMode().name(),
                q.getCategory().getId(),
                q.getAuthor().getId()
        );
    }
}