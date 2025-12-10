package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuizVersion;
import com.diploma.proforientation.model.enumeration.QuestionType;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.repository.QuizVersionRepository;
import com.diploma.proforientation.service.QuestionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepo;
    private final QuizVersionRepository versionRepo;

    @Override
    public QuestionDto create(CreateQuestionRequest req) {
        QuizVersion version = versionRepo.findById(req.quizVersionId())
                .orElseThrow(() -> new EntityNotFoundException("Quiz version not found"));

        Question q = new Question();
        q.setQuizVersion(version);
        q.setOrd(req.ord());
        q.setQtype(Enum.valueOf(QuestionType.class,
                req.qtype()
        ));
        q.setTextDefault(req.text());

        return toDto(questionRepo.save(q));
    }

    @Override
    public QuestionDto update(Integer id, UpdateQuestionRequest req) {
        Question q = questionRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Question not found"));

        if (req.ord() != null) {
            q.setOrd(req.ord());
        }
        if (req.qtype() != null) {
            q.setQtype(Enum.valueOf(QuestionType.class,
                    req.qtype()
            ));
        }
        if (req.text() != null) {
            q.setTextDefault(req.text());
        }

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

    private QuestionDto toDto(Question q) {
        return new QuestionDto(
                q.getId(),
                q.getQuizVersion().getId(),
                q.getOrd(),
                q.getQtype().name(),
                q.getTextDefault()
        );
    }
}