package com.diploma.proforientation.dto.request.update;

public record UpdateQuestionRequest(
        Integer ord,
        String qtype,
        String text
) {}