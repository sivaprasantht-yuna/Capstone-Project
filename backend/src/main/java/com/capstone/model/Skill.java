package com.capstone.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "skills",
       uniqueConstraints = @UniqueConstraint(columnNames = "skill_name"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "skill_name", nullable = false, unique = true, length = 100)
    private String skillName;

    @Column(length = 50)
    private String category;  // e.g. "Programming", "Design", "Domain", "Soft Skill"

    @Column(name = "icon_url")
    private String iconUrl;
}
