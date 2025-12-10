package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Profession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfessionRepository extends JpaRepository<Profession, Integer> {
}
