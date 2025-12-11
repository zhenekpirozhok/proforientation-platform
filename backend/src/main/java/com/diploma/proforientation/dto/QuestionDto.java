package com.diploma.proforientation.dto;

import java.util.List;

public record QuestionDto(
        Integer id,
        Integer quizVersionId,
        Integer ord,
        String qtype,
        String text,
        List<OptionDto> options
) {}