package com.capstone.repository;

import com.capstone.model.StudentContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentContributionRepository extends JpaRepository<StudentContribution, Long> {
    Optional<StudentContribution> findByTeamIdAndStudentId(Long teamId, Long studentId);
    List<StudentContribution> findByTeamId(Long teamId);
    List<StudentContribution> findByStudentId(Long studentId);
}
