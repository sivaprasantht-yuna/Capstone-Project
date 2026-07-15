package com.capstone.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "year_of_study")
    private Integer yearOfStudy;

    @Column(length = 1000)
    private String bio;

    @Column(name = "resume_link")
    private String resumeLink;

    @Column(name = "github_link")
    private String githubLink;

    @Column(name = "linkedin_link")
    private String linkedinLink;

    @Column(name = "total_points")
    @Builder.Default
    private Integer totalPoints = 0;

    @Column(name = "is_looking_for_team")
    @Builder.Default
    private Boolean isLookingForTeam = true;
}
