package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.model.QuestionOptionTrait;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionOptionTraitRepository extends JpaRepository<QuestionOptionTrait, QuestionOptionTrait.QuestionOptionTraitId> {
    void deleteByOption(QuestionOption option);
    List<QuestionOptionTrait> findByOptionId(Integer optionId);
}
