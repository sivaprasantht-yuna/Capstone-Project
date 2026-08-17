package com.capstone.service;

import com.capstone.model.*;
import com.capstone.notification.NotificationRequest;
import com.capstone.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final StudentTaskRepository taskRepository;
    private final StudentContributionRepository contributionRepository;
    private final ProjectEvidenceRepository evidenceRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public StudentTask createTask(Long teamId, Long assignedToId, Long assignedById,
                                   String title, String description, String dueDate, Integer pointValue) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        User assignedTo = userRepository.findById(assignedToId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        User assignedBy = userRepository.findById(assignedById)
                .orElseThrow(() -> new RuntimeException("Assigner not found"));

        StudentTask task = StudentTask.builder()
                .team(team)
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .title(title)
                .description(description)
                .dueDate(dueDate != null ? java.time.LocalDate.parse(dueDate) : null)
                .pointValue(pointValue != null ? pointValue : 10)
                .status(StudentTask.TaskStatus.PENDING)
                .build();
        task = taskRepository.save(task);

        // Update contribution record
        updateContributionRecord(teamId, assignedToId, false);

        // Notify assigned student
        notificationService.send(
                NotificationRequest.to(assignedToId)
                        .message("📋 New task assigned: \"" + title + "\" in team " + team.getTeamName())
                        .type(Notification.NotificationType.TASK_ASSIGNED)
                        .reference(teamId, "TEAM")
                        .build()
        );

        return task;
    }

    @Transactional
    public StudentTask updateTaskStatus(Long taskId, Long userId, String status, String completionNote) {
        StudentTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getAssignedTo().getId().equals(userId)) {
            throw new RuntimeException("You can only update your own tasks");
        }

        StudentTask.TaskStatus newStatus = StudentTask.TaskStatus.valueOf(status.toUpperCase());
        task.setStatus(newStatus);
        if (completionNote != null) task.setCompletionNote(completionNote);
        if (newStatus == StudentTask.TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
            updateContributionRecord(task.getTeam().getId(), userId, true);
        }

        return taskRepository.save(task);
    }

    @Transactional
    public ProjectEvidence addEvidence(Long taskId, Long userId, Long teamId,
                                        String title, String description,
                                        String evidenceType, String fileUrl) {
        StudentTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        User uploadedBy = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        ProjectEvidence evidence = ProjectEvidence.builder()
                .team(team)
                .uploadedBy(uploadedBy)
                .task(task)
                .title(title)
                .description(description)
                .evidenceType(ProjectEvidence.EvidenceType.valueOf(
                        evidenceType != null ? evidenceType.toUpperCase() : "DOCUMENT"))
                .fileUrl(fileUrl)
                .verificationStatus(ProjectEvidence.VerificationStatus.UNVERIFIED)
                .build();

        return evidenceRepository.save(evidence);
    }

    // ─── Contribution tracking helper ─────────────────────────────────────────

    private void updateContributionRecord(Long teamId, Long studentId, boolean taskCompleted) {
        StudentContribution contribution = contributionRepository
                .findByTeamIdAndStudentId(teamId, studentId)
                .orElseGet(() -> StudentContribution.builder()
                        .team(teamRepository.findById(teamId).orElseThrow())
                        .student(userRepository.findById(studentId).orElseThrow())
                        .build());

        long total = taskRepository.countByTeamIdAndAssignedToIdAndStatus(
                teamId, studentId, StudentTask.TaskStatus.COMPLETED) +
                taskRepository.countByTeamIdAndAssignedToIdAndStatus(
                        teamId, studentId, StudentTask.TaskStatus.PENDING) +
                taskRepository.countByTeamIdAndAssignedToIdAndStatus(
                        teamId, studentId, StudentTask.TaskStatus.IN_PROGRESS);
        long completed = taskRepository.countByTeamIdAndAssignedToIdAndStatus(
                teamId, studentId, StudentTask.TaskStatus.COMPLETED);

        long teamTotal = taskRepository.countByTeamId(teamId);
        long teamCompleted = taskRepository.countByTeamIdAndStatus(teamId, StudentTask.TaskStatus.COMPLETED);

        contribution.setTasksTotal((int) total);
        contribution.setTasksCompleted((int) completed);

        // Contribution percentage = (student completed tasks / team total tasks) * 100
        double pct = teamTotal == 0 ? 0 : ((double) completed / teamTotal) * 100;
        contribution.setContributionPercentage(Math.round(pct * 10.0) / 10.0);

        contributionRepository.save(contribution);
    }
}
