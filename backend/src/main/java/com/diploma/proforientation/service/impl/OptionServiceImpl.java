package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.request.create.CreateOptionRequest;
import com.diploma.proforientation.dto.request.update.UpdateOptionRequest;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.repository.QuestionOptionRepository;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.service.OptionService;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.diploma.proforientation.util.ErrorMessages.OPTION_NOT_FOUND;
import static com.diploma.proforientation.util.ErrorMessages.QUESTION_NOT_FOUND;

@Service
@RequiredArgsConstructor
public class OptionServiceImpl implements OptionService {

    public static final String ENTITY_TYPE_OPTION = "question_option";
    public static final String FIELD_TEXT = "text";

    private final QuestionOptionRepository optionRepo;
    private final QuestionRepository questionRepo;
    private final TranslationResolver translationResolver;

    @Override
    @Transactional
    public OptionDto create(CreateOptionRequest req) {
        Question question = questionRepo.findById(req.questionId())
                .orElseThrow(() -> new EntityNotFoundException(QUESTION_NOT_FOUND));

        QuestionOption opt = new QuestionOption();
        opt.setQuestion(question);
        opt.setOrd(req.ord());
        opt.setLabelDefault(req.label());

        return toDto(optionRepo.save(opt));
    }

    @Override
    @Transactional
    public OptionDto update(Integer id, UpdateOptionRequest req) {
        QuestionOption opt = optionRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(OPTION_NOT_FOUND));

        if (req.ord() != null) {
            opt.setOrd(req.ord());
        }
        if (req.label() != null) {
            opt.setLabelDefault(req.label());
        }

        return toDto(optionRepo.save(opt));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        optionRepo.deleteById(id);
    }

    @Override
    public OptionDto updateOrder(Integer id, Integer ord) {
        QuestionOption opt = optionRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(OPTION_NOT_FOUND));
        opt.setOrd(ord);
        return toDto(optionRepo.save(opt));
    }

    @Override
    public List<OptionDto> getByQuestionLocalized(Integer questionId, String locale) {
        questionRepo.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException(QUESTION_NOT_FOUND));

        return optionRepo.findByQuestionIdOrderByOrd(questionId)
                .stream()
                .map(o -> toDtoLocalized(o, locale))
                .toList();
    }

    private OptionDto toDto(QuestionOption opt) {
        return new OptionDto(
                opt.getId(),
                opt.getQuestion().getId(),
                opt.getOrd(),
                opt.getLabelDefault()
        );
    }

    private OptionDto toDtoLocalized(QuestionOption option, String locale) {

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
}