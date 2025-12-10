package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.QuestionOption;
import com.diploma.proforientation.model.QuestionOptionTrait;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionOptionTraitRepository extends JpaRepository<QuestionOptionTrait, QuestionOptionTrait.QuestionOptionTraitId> {
    void deleteByOption(QuestionOption option);
}
