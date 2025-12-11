package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.QuizProfession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizProfessionRepository extends JpaRepository<QuizProfession, QuizProfession.QuizProfessionId> {
}
