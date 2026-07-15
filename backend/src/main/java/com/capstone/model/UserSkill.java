package com.capstone.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_skills",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "skill_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    /**
     * Proficiency: 1=Beginner, 2=Intermediate, 3=Advanced, 4=Expert.
     * Used as the weight in the skill-vector cosine similarity algorithm.
     */
    @Column(name = "proficiency_level", nullable = false)
    @Builder.Default
    private Integer proficiencyLevel = 1;
}
