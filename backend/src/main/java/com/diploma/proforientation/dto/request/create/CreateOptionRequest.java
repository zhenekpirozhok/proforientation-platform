package com.diploma.proforientation.dto.request.create;

public record CreateOptionRequest(
        Integer questionId,
        Integer ord,
        String label
) {}