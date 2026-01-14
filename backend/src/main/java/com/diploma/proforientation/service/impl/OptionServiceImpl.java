package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.request.create.CreateOptionRequest;
import com.diploma.proforientation.dto.request.update.UpdateOptionRequest;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.model.QuestionOptionTrait;
import com.diploma.proforientation.repository.QuestionOptionRepository;
import com.diploma.proforientation.repository.QuestionOptionTraitRepository;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.service.OptionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.diploma.proforientation.util.Constants.OPTION_NOT_FOUND;
import static com.diploma.proforientation.util.Constants.QUESTION_NOT_FOUND;

@Service
@RequiredArgsConstructor
public class OptionServiceImpl implements OptionService {

    private final QuestionOptionRepository optionRepo;
    private final QuestionRepository questionRepo;
    private final QuestionOptionTraitRepository traitRepo;

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

        if (req.ord() != null) opt.setOrd(req.ord());
        if (req.label() != null) opt.setLabelDefault(req.label());

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

    private OptionDto toDto(QuestionOption opt) {
        List<QuestionOptionTrait> traits = traitRepo.findByOptionId(opt.getId());

        Map<Integer, Double> weightsByTraitId = traits.stream()
                .collect(Collectors.toMap(
                        t -> t.getTrait().getId(),
                        t -> t.getWeight().doubleValue()
                ));

        return new OptionDto(
                opt.getId(),
                opt.getQuestion().getId(),
                opt.getOrd(),
                opt.getLabelDefault(),
                weightsByTraitId
        );
    }
}