package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Quiz;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Integer>, JpaSpecificationExecutor<Quiz> {
    Optional<Quiz> findByCode(String code);
    Page<Quiz> findAllByAuthorId(Integer authorId, Pageable pageable);
    Page<Quiz> findAllByStatus(QuizStatus status, Pageable pageable);
}
