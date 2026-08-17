package com.capstone.repository;

import com.capstone.model.StudentTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudentTaskRepository extends JpaRepository<StudentTask, Long> {
    List<StudentTask> findByTeamId(Long teamId);
    List<StudentTask> findByTeamIdAndAssignedToId(Long teamId, Long userId);
    List<StudentTask> findByAssignedToId(Long userId);
    long countByTeamIdAndStatus(Long teamId, StudentTask.TaskStatus status);
    long countByTeamIdAndAssignedToIdAndStatus(Long teamId, Long userId, StudentTask.TaskStatus status);
    long countByTeamId(Long teamId);
}
