package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Profession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProfessionRepository extends JpaRepository<Profession, Integer> {
    List<Profession> findByCategoryId(Integer categoryId);
    @Query("SELECT p.id FROM Profession p WHERE p.mlClassCode = :code")
    Optional<Integer> findIdByMlClassCode(String code);
    Optional<Profession> findByCode(String code);
    @Query("""
        SELECT p
        FROM Profession p
        WHERE
            (:categoryId IS NULL OR p.category.id = :categoryId)
        AND (
            :q IS NULL OR :q = '' OR
            LOWER(p.titleDefault) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(p.code) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(p.mlClassCode) LIKE LOWER(CONCAT('%', :q, '%'))
        )
    """)
    Page<Profession> search(
            @Param("q") String q,
            @Param("categoryId") Integer categoryId,
            Pageable pageable
    );
}
