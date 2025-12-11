package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.TraitProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TraitProfileRepository extends JpaRepository<TraitProfile, Integer> {
    Optional<TraitProfile> findByCode(String code);
}
