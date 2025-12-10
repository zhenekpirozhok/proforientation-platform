package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.request.OptionTraitRequest;

import java.util.List;

public interface OptionTraitService {
    void assignTraits(Integer optionId, List<OptionTraitRequest> traits);
    void updateTraits(Integer optionId, List<OptionTraitRequest> traits);
}