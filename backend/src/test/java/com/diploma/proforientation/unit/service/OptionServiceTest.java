package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.request.create.CreateOptionRequest;
import com.diploma.proforientation.dto.request.update.UpdateOptionRequest;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.model.QuestionOptionTrait;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.repository.QuestionOptionRepository;
import com.diploma.proforientation.repository.QuestionOptionTraitRepository;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.service.impl.OptionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class OptionServiceTest {

    @Mock
    private QuestionOptionRepository optionRepo;

    @Mock
    private QuestionRepository questionRepo;

    @Mock
    private QuestionOptionTraitRepository traitRepo;

    @InjectMocks
    private OptionServiceImpl service;

    private Question question;
    private QuestionOption opt;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        question = new Question();
        question.setId(2);

        opt = new QuestionOption();
        opt.setId(10);
        opt.setOrd(1);
        opt.setLabelDefault("Default Label");
        opt.setQuestion(question);
    }

    @Test
    void create_shouldSaveOption_withEmptyWeights() {
        CreateOptionRequest req = new CreateOptionRequest(2, 1, "Yes");

        when(questionRepo.findById(2)).thenReturn(Optional.of(question));

        QuestionOption saved = new QuestionOption();
        saved.setId(10);
        saved.setQuestion(question);
        saved.setOrd(1);
        saved.setLabelDefault("Yes");

        when(optionRepo.save(any())).thenReturn(saved);
        when(traitRepo.findByOptionId(10)).thenReturn(List.of());

        OptionDto dto = service.create(req);

        assertThat(dto.id()).isEqualTo(10);
        assertThat(dto.weightsByTraitId()).isEmpty();
        verify(optionRepo).save(any());
    }

    @Test
    void update_shouldModifyOption_withWeights() {
        QuestionOption opt = new QuestionOption();
        opt.setId(5);
        opt.setQuestion(question);
        opt.setOrd(1);
        opt.setLabelDefault("Old");

        TraitProfile trait = new TraitProfile();
        trait.setId(1);

        QuestionOptionTrait qot = new QuestionOptionTrait();
        qot.setOption(opt);
        qot.setTrait(trait);
        qot.setWeight(BigDecimal.valueOf(2.0));

        when(optionRepo.findById(5)).thenReturn(Optional.of(opt));
        when(optionRepo.save(opt)).thenReturn(opt);
        when(traitRepo.findByOptionId(5)).thenReturn(List.of(qot));

        UpdateOptionRequest req = new UpdateOptionRequest(2, "New Label");

        OptionDto dto = service.update(5, req);

        assertThat(dto.ord()).isEqualTo(2);
        assertThat(dto.label()).isEqualTo("New Label");
        assertThat(dto.weightsByTraitId())
                .containsEntry(1, 2.0);
    }

    @Test
    void delete_shouldDelegate() {
        service.delete(7);
        verify(optionRepo).deleteById(7);
    }

    @Test
    void updateOrder_shouldChangeOrdAndIncludeWeights() {
        TraitProfile trait = new TraitProfile();
        trait.setId(2);

        QuestionOptionTrait qot = new QuestionOptionTrait();
        qot.setOption(opt);
        qot.setTrait(trait);
        qot.setWeight(BigDecimal.valueOf(3.0));

        when(optionRepo.findById(10)).thenReturn(Optional.of(opt));
        when(optionRepo.save(opt)).thenReturn(opt);
        when(traitRepo.findByOptionId(10)).thenReturn(List.of(qot));

        OptionDto dto = service.updateOrder(10, 42);

        assertThat(dto.ord()).isEqualTo(42);
        assertThat(dto.weightsByTraitId()).containsEntry(2, 3.0);
    }
}