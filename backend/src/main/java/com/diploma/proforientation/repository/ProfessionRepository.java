package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Profession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ProfessionRepository extends JpaRepository<Profession, Integer> {
    Optional<Profession> findByTitleDefault(String titleDefault);
    @Query("SELECT p.id FROM Profession p WHERE p.mlClassCode = :code")
    Optional<Integer> findIdByMlClassCode(String code);
}
