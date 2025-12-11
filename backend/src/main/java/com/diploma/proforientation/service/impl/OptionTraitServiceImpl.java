package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.request.OptionTraitRequest;
import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.model.QuestionOptionTrait;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.repository.QuestionOptionRepository;
import com.diploma.proforientation.repository.QuestionOptionTraitRepository;
import com.diploma.proforientation.repository.TraitProfileRepository;
import com.diploma.proforientation.service.OptionTraitService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OptionTraitServiceImpl implements OptionTraitService {

    private final QuestionOptionRepository optionRepo;
    private final TraitProfileRepository traitRepo;
    private final QuestionOptionTraitRepository qotRepo;

    @Override
    @Transactional
    public void assignTraits(Integer optionId, List<OptionTraitRequest> traits) {
        QuestionOption option = optionRepo.findById(optionId)
                .orElseThrow(() -> new EntityNotFoundException("Option not found"));

        for (OptionTraitRequest req : traits) {
            TraitProfile trait = traitRepo.findById(req.traitId())
                    .orElseThrow(() -> new EntityNotFoundException("Trait not found: " + req.traitId()));

            QuestionOptionTrait entity = new QuestionOptionTrait();
            entity.setOption(option);
            entity.setTrait(trait);
            entity.setWeight(req.weight() != null ? req.weight() : BigDecimal.valueOf(1.0));

            qotRepo.save(entity);
        }
    }

    @Override
    @Transactional
    public void updateTraits(Integer optionId, List<OptionTraitRequest> traits) {
        QuestionOption option = optionRepo.findById(optionId)
                .orElseThrow(() -> new EntityNotFoundException("Option not found"));

        qotRepo.deleteByOption(option);

        assignTraits(optionId, traits);
    }
}