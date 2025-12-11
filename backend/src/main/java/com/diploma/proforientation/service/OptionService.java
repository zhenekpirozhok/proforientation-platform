package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.request.create.CreateOptionRequest;
import com.diploma.proforientation.dto.request.update.UpdateOptionRequest;

import java.util.List;

public interface OptionService {

    OptionDto create(CreateOptionRequest req);
    OptionDto update(Integer id, UpdateOptionRequest req);
    void delete(Integer id);
    OptionDto updateOrder(Integer id, Integer ord);
    List<OptionDto> getByQuestionLocalized(Integer questionId, String locale);
}