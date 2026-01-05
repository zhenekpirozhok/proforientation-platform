package com.diploma.proforientation.scoring.ml;

import com.diploma.proforientation.model.Profession;

import java.util.List;
import java.util.Map;

public interface MlProfessionExplanationService {
    Map<Integer, String> explainProfessions(List<Profession> professions);
}
