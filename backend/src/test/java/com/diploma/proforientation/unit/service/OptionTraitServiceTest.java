package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.request.OptionTraitRequest;
import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.model.QuestionOptionTrait;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.repository.QuestionOptionRepository;
import com.diploma.proforientation.repository.QuestionOptionTraitRepository;
import com.diploma.proforientation.repository.TraitProfileRepository;
import com.diploma.proforientation.service.impl.OptionTraitServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class OptionTraitServiceTest {

    @Mock private QuestionOptionRepository optionRepo;
    @Mock private TraitProfileRepository traitRepo;
    @Mock private QuestionOptionTraitRepository qotRepo;

    @InjectMocks
    private OptionTraitServiceImpl service;

    QuestionOption option;
    TraitProfile trait1;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        option = new QuestionOption();
        option.setId(10);

        trait1 = new TraitProfile();
        trait1.setId(1);
    }

    @Test
    void assignTraits_shouldSaveMappings() {
        when(optionRepo.findById(10)).thenReturn(Optional.of(option));
        when(traitRepo.findById(1)).thenReturn(Optional.of(trait1));

        OptionTraitRequest req = new OptionTraitRequest(1, BigDecimal.valueOf(2.5));

        service.assignTraits(10, List.of(req));

        verify(qotRepo, times(1)).save(any(QuestionOptionTrait.class));
    }

    @Test
    void updateTraits_shouldDeleteAndReassign() {
        when(optionRepo.findById(10)).thenReturn(Optional.of(option));
        when(traitRepo.findById(1)).thenReturn(Optional.of(trait1));

        OptionTraitRequest req = new OptionTraitRequest(1, BigDecimal.valueOf(1.0));

        service.updateTraits(10, List.of(req));

        verify(qotRepo).deleteByOption(option);
        verify(qotRepo).save(any());
    }

    @Test
    void assignTraits_shouldFailIfOptionMissing() {
        when(optionRepo.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignTraits(99, List.of()))
                .isInstanceOf(EntityNotFoundException.class);
    }
}