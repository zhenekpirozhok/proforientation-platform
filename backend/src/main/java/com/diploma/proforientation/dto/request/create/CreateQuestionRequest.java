package com.diploma.proforientation.dto.request.create;

public record CreateQuestionRequest(
        Integer quizVersionId,
        Integer ord,
        String qtype,
        String text
) {}