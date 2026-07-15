package com.capstone.repository;

import com.capstone.model.Mentorship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MentorshipRepository extends JpaRepository<Mentorship, Long> {

    Optional<Mentorship> findByTeamIdAndStatus(Long teamId, Mentorship.MentorshipStatus status);

    List<Mentorship> findByFacultyIdAndStatus(Long facultyId, Mentorship.MentorshipStatus status);

    @Query("SELECT COUNT(m) FROM Mentorship m WHERE m.faculty.id = :facultyId AND m.status = 'ACCEPTED'")
    long countActiveMentorships(Long facultyId);

    @Query("SELECT AVG(m.teamRatingForMentor) FROM Mentorship m WHERE m.faculty.id = :facultyId AND m.teamRatingForMentor IS NOT NULL")
    Double getAverageRatingForMentor(Long facultyId);

    boolean existsByTeamIdAndFacultyIdAndStatus(Long teamId, Long facultyId, Mentorship.MentorshipStatus status);
}
