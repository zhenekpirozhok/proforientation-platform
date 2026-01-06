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

import static com.diploma.proforientation.util.Constants.OPTION_NOT_FOUND;
import static com.diploma.proforientation.util.Constants.TRAIT_NOT_FOUND;
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
                .orElseThrow(() -> new EntityNotFoundException(OPTION_NOT_FOUND));

        assignTraitsInternal(option, traits);
    }

    @Override
    @Transactional
    public void updateTraits(Integer optionId, List<OptionTraitRequest> traits) {
        QuestionOption option = optionRepo.findById(optionId)
                .orElseThrow(() -> new EntityNotFoundException(OPTION_NOT_FOUND));

        qotRepo.deleteByOption(option);

        assignTraitsInternal(option, traits);
    }

    /**
     * Internal helper method. Not transactional on purpose:
     * it's always called inside an existing @Transactional method.
     */
    private void assignTraitsInternal(QuestionOption option, List<OptionTraitRequest> traits) {
        for (OptionTraitRequest req : traits) {
            TraitProfile trait = traitRepo.findById(req.traitId())
                    .orElseThrow(() -> new EntityNotFoundException(TRAIT_NOT_FOUND + req.traitId()));

            QuestionOptionTrait entity = new QuestionOptionTrait();
            entity.setOption(option);
            entity.setTrait(trait);
            entity.setWeight(req.weight() != null ? req.weight() : BigDecimal.valueOf(1.0));

            qotRepo.save(entity);
        }
    }
}