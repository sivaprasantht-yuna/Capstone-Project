package com.capstone.repository;

import com.capstone.model.ProjectEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectEvidenceRepository extends JpaRepository<ProjectEvidence, Long> {
    List<ProjectEvidence> findByTeamId(Long teamId);
    List<ProjectEvidence> findByUploadedByIdAndTeamId(Long uploadedById, Long teamId);
    List<ProjectEvidence> findByUploadedById(Long uploadedById);
    List<ProjectEvidence> findByTaskId(Long taskId);
}
