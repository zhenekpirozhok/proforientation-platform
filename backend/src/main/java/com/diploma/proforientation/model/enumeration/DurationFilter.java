package com.diploma.proforientation.model.enumeration;

public enum DurationFilter {
    ANY(null, null),
    LT_5_MIN(null, 300),
    MIN_5_15(300, 900),
    MIN_15_30(900, 1800),
    GT_30_MIN(1800, null);

    public final Integer minSec;
    public final Integer maxSec;

    DurationFilter(Integer minSec, Integer maxSec) {
        this.minSec = minSec;
        this.maxSec = maxSec;
    }
}