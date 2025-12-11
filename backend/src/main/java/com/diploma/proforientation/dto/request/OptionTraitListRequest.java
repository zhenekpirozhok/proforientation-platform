package com.diploma.proforientation.dto.request;

import java.util.List;

public record OptionTraitListRequest(
        List<OptionTraitRequest> traits
) {}