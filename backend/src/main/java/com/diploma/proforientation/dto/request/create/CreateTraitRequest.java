package com.diploma.proforientation.dto.request.create;

public record CreateTraitRequest(
        String code,
        String name,
        String description,
        String bipolarPairCode
) {}