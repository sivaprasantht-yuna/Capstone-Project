package com.capstone.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "faculty_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FacultyProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 100)
    private String designation;

    @Column(name = "max_team_capacity")
    @Builder.Default
    private Integer maxTeamCapacity = 5;

    @Column(name = "current_team_count")
    @Builder.Default
    private Integer currentTeamCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status")
    @Builder.Default
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;

    @Column(length = 2000)
    private String bio;

    @Column(name = "office_location", length = 100)
    private String officeLocation;

    /** Average rating given by student teams (1–5) */
    @Column(name = "mentor_rating")
    @Builder.Default
    private Double mentorRating = 0.0;

    @Column(name = "total_ratings")
    @Builder.Default
    private Integer totalRatings = 0;

    public enum AvailabilityStatus {
        AVAILABLE, PARTIALLY_AVAILABLE, UNAVAILABLE
    }
}
