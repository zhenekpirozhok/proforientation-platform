package com.diploma.proforientation.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "translations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"entity_type", "entity_id", "locale", "field"}))
public class Translation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Integer entityId;

    @Column(nullable = false)
    private String locale;

    @Column(nullable = false)
    private String field;

    @Column(nullable = false)
    private String text;
}
