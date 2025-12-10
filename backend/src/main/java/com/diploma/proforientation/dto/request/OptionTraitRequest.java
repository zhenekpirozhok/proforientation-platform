package com.diploma.proforientation.dto.request;

import java.math.BigDecimal;

public record OptionTraitRequest(
        Integer traitId,
        BigDecimal weight
) {}