package com.diploma.proforientation.dto;

public record QuestionDto(
        Integer id,
        Integer quizVersionId,
        Integer ord,
        String qtype,
        String text
) {}