package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, Integer> {
}
