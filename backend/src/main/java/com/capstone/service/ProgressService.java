package com.capstone.service;

import com.capstone.model.*;
import com.capstone.notification.NotificationRequest;
import com.capstone.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MilestoneRepository milestoneRepository;
    private final StudentTaskRepository studentTaskRepository;
    private final StudentContributionRepository contributionRepository;
    private final ProjectEvidenceRepository evidenceRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final MentorshipRepository mentorshipRepository;

    // ─── Team Progress ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getTeamProgress(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found: " + teamId));

        List<Milestone> milestones = milestoneRepository.findByTeamIdOrderBySequenceOrder(teamId);
        List<StudentTask> tasks = studentTaskRepository.findByTeamId(teamId);
        List<StudentContribution> contributions = contributionRepository.findByTeamId(teamId);

        // Overall progress
        long completedMilestones = milestones.stream()
                .filter(m -> m.getStatus() == Milestone.MilestoneStatus.APPROVED).count();
        int milestonePercent = milestones.isEmpty() ? 0 :
                (int) Math.round((double) completedMilestones / milestones.size() * 100);

        long completedTasks = tasks.stream()
                .filter(t -> t.getStatus() == StudentTask.TaskStatus.COMPLETED).count();
        int taskPercent = tasks.isEmpty() ? 50 :
                (int) Math.round((double) completedTasks / tasks.size() * 100);

        int overallPercent = tasks.isEmpty() ? milestonePercent :
                (int) Math.round((milestonePercent * 0.6) + (taskPercent * 0.4));

        // Activity counts
        long pendingTasks = tasks.stream().filter(t -> t.getStatus() == StudentTask.TaskStatus.PENDING).count();
        long inProgressTasks = tasks.stream().filter(t -> t.getStatus() == StudentTask.TaskStatus.IN_PROGRESS).count();
        long overdueTasks = tasks.stream().filter(t -> t.getStatus() == StudentTask.TaskStatus.OVERDUE).count();
        long evidenceCount = evidenceRepository.findByTeamId(teamId).size();

        // Team health
        String health = calculateTeamHealth(milestones, tasks, team);

        // Milestone data
        List<Map<String, Object>> milestoneData = milestones.stream().map(m -> {
            Map<String, Object> ms = new LinkedHashMap<>();
            ms.put("id", m.getId());
            ms.put("title", m.getTitle());
            ms.put("description", m.getDescription());
            ms.put("dueDate", m.getDueDate() != null ? m.getDueDate().toString() : null);
            ms.put("status", m.getStatus() != null ? m.getStatus().name() : "PENDING");
            ms.put("submittedAt", m.getSubmittedAt() != null ? m.getSubmittedAt().toString() : null);
            ms.put("sequenceOrder", m.getSequenceOrder());
            return ms;
        }).collect(Collectors.toList());

        // Contribution data
        List<Map<String, Object>> contributionData = contributions.stream().map(c -> {
            Map<String, Object> cd = new LinkedHashMap<>();
            cd.put("studentId", c.getStudent().getId());
            cd.put("studentName", c.getStudent().getName());
            cd.put("avatarInitial", c.getStudent().getName() != null && !c.getStudent().getName().isEmpty()
                    ? c.getStudent().getName().substring(0, 1).toUpperCase() : "S");
            cd.put("contributionPercentage", c.getContributionPercentage());
            cd.put("tasksCompleted", c.getTasksCompleted());
            cd.put("tasksTotal", c.getTasksTotal());
            cd.put("membershipStatus", c.getMembershipStatus().name());
            return cd;
        }).sorted(Comparator.comparingDouble(m -> -((Double) m.get("contributionPercentage"))))
          .collect(Collectors.toList());

        // Current phase
        String currentPhase = determinePhase(milestones, team.getStatus());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("teamId", teamId);
        result.put("teamName", team.getTeamName());
        result.put("teamStatus", team.getStatus().name());
        result.put("projectTitle", team.getProject() != null ? team.getProject().getTitle() : "");
        result.put("createdAt", team.getCreatedAt() != null ? team.getCreatedAt().toString() : null);
        result.put("overallProgress", overallPercent);
        result.put("currentPhase", currentPhase);
        result.put("teamHealth", health);
        result.put("totalTasks", tasks.size());
        result.put("completedTasks", completedTasks);
        result.put("inProgressTasks", inProgressTasks);
        result.put("pendingTasks", pendingTasks);
        result.put("overdueTasks", overdueTasks);
        result.put("totalMilestones", milestones.size());
        result.put("completedMilestones", completedMilestones);
        result.put("evidenceSubmitted", evidenceCount);
        result.put("milestones", milestoneData);
        result.put("contributions", contributionData);
        result.put("hasMentor", hasActiveMentor(teamId));
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTeamTimeline(Long teamId) {
        List<Event> events = eventRepository.findByTeamIdOrderByCreatedAtAsc(teamId);
        return events.stream().map(e -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", e.getId());
            entry.put("eventType", e.getEventType());
            entry.put("createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
            entry.put("userName", e.getUser() != null ? e.getUser().getName() : "System");
            entry.put("eventData", e.getEventData());
            return entry;
        }).collect(Collectors.toList());
    }

    // ─── Student Progress ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentProgress(Long studentId, Long teamId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        List<StudentTask> tasks = studentTaskRepository.findByTeamIdAndAssignedToId(teamId, studentId);
        List<StudentTask> allTasks = studentTaskRepository.findByAssignedToId(studentId);
        Optional<StudentContribution> contribution = contributionRepository.findByTeamIdAndStudentId(teamId, studentId);
        List<ProjectEvidence> evidence = evidenceRepository.findByUploadedByIdAndTeamId(studentId, teamId);

        long completed = tasks.stream().filter(t -> t.getStatus() == StudentTask.TaskStatus.COMPLETED).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus() == StudentTask.TaskStatus.IN_PROGRESS).count();
        long pending = tasks.stream().filter(t -> t.getStatus() == StudentTask.TaskStatus.PENDING).count();
        long overdue = tasks.stream().filter(t -> t.getStatus() == StudentTask.TaskStatus.OVERDUE).count();

        int personalProgress = tasks.isEmpty() ? 0 :
                (int) Math.round((double) completed / tasks.size() * 100);

        // Task history
        List<Map<String, Object>> taskHistory = allTasks.stream().map(t -> {
            Map<String, Object> td = new LinkedHashMap<>();
            td.put("id", t.getId());
            td.put("title", t.getTitle());
            td.put("description", t.getDescription());
            td.put("status", t.getStatus().name());
            td.put("dueDate", t.getDueDate() != null ? t.getDueDate().toString() : null);
            td.put("assignedAt", t.getAssignedAt() != null ? t.getAssignedAt().toString() : null);
            td.put("completedAt", t.getCompletedAt() != null ? t.getCompletedAt().toString() : null);
            td.put("teamId", t.getTeam() != null ? t.getTeam().getId() : null);
            td.put("teamName", t.getTeam() != null ? t.getTeam().getTeamName() : "");
            td.put("pointValue", t.getPointValue());
            return td;
        }).collect(Collectors.toList());

        // Evidence
        List<Map<String, Object>> evidenceData = evidence.stream().map(ev -> {
            Map<String, Object> ed = new LinkedHashMap<>();
            ed.put("id", ev.getId());
            ed.put("title", ev.getTitle());
            ed.put("description", ev.getDescription());
            ed.put("evidenceType", ev.getEvidenceType().name());
            ed.put("fileUrl", ev.getFileUrl());
            ed.put("submittedAt", ev.getSubmittedAt() != null ? ev.getSubmittedAt().toString() : null);
            ed.put("verificationStatus", ev.getVerificationStatus().name());
            ed.put("taskTitle", ev.getTask() != null ? ev.getTask().getTitle() : null);
            return ed;
        }).collect(Collectors.toList());

        // Current team membership
        Optional<TeamMember> membership = teamMemberRepository.findByTeamIdAndUserId(teamId, studentId);
        String membershipStatus = membership.map(m -> m.getMembershipStatus() != null ?
                m.getMembershipStatus().name() : "ACTIVE").orElse("FORMER_MEMBER");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("studentId", studentId);
        result.put("studentName", student.getName());
        result.put("department", student.getDepartment());
        result.put("email", student.getEmail());
        result.put("membershipStatus", membershipStatus);
        result.put("personalProgress", personalProgress);
        result.put("tasksCompleted", completed);
        result.put("tasksInProgress", inProgress);
        result.put("tasksPending", pending);
        result.put("tasksOverdue", overdue);
        result.put("tasksTotal", tasks.size());
        result.put("contributionPercentage", contribution.map(StudentContribution::getContributionPercentage).orElse(0.0));
        result.put("taskHistory", taskHistory);
        result.put("evidence", evidenceData);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStudentProjectHistory(Long studentId) {
        List<TeamMember> allMemberships = teamMemberRepository.findByUserId(studentId);
        return allMemberships.stream()
                .filter(m -> m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED)
                .map(m -> {
                    Team team = m.getTeam();
                    Optional<StudentContribution> contribution =
                            contributionRepository.findByTeamIdAndStudentId(team.getId(), studentId);
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("teamId", team.getId());
                    entry.put("teamName", team.getTeamName());
                    entry.put("teamStatus", team.getStatus().name());
                    entry.put("membershipStatus", m.getMembershipStatus() != null ?
                            m.getMembershipStatus().name() : "ACTIVE");
                    entry.put("projectTitle", team.getProject() != null ? team.getProject().getTitle() : "");
                    entry.put("projectDomain", team.getProject() != null ? team.getProject().getDomain() : "");
                    entry.put("joinedAt", m.getJoinedAt() != null ? m.getJoinedAt().toString() : null);
                    entry.put("removedAt", m.getRemovedAt() != null ? m.getRemovedAt().toString() : null);
                    entry.put("roleInTeam", m.getRoleInTeam());
                    entry.put("contributionPercentage",
                            contribution.map(StudentContribution::getContributionPercentage).orElse(0.0));
                    return entry;
                }).collect(Collectors.toList());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String calculateTeamHealth(List<Milestone> milestones, List<StudentTask> tasks, Team team) {
        long overdue = tasks.stream().filter(t -> t.getStatus() == StudentTask.TaskStatus.OVERDUE).count();
        long total = tasks.size();
        long completedMilestones = milestones.stream()
                .filter(m -> m.getStatus() == Milestone.MilestoneStatus.APPROVED).count();

        if (total == 0 && milestones.isEmpty()) return "ON_TRACK";

        double overdueRatio = total > 0 ? (double) overdue / total : 0;
        boolean hasMissedMilestones = milestones.stream()
                .anyMatch(m -> m.getStatus() == Milestone.MilestoneStatus.OVERDUE);

        if (hasMissedMilestones || overdueRatio > 0.4) return "AT_RISK";
        if (overdueRatio > 0.2 || (milestones.size() > 0 && completedMilestones == 0)) return "NEEDS_ATTENTION";
        return "ON_TRACK";
    }

    private String determinePhase(List<Milestone> milestones, Team.TeamStatus status) {
        if (status == Team.TeamStatus.DISSOLVED) return "Dissolved";
        if (status == Team.TeamStatus.COMPLETED) return "Completed";
        if (status == Team.TeamStatus.UNDER_REVIEW) return "Final Review";
        long completed = milestones.stream().filter(m -> m.getStatus() == Milestone.MilestoneStatus.APPROVED).count();
        if (completed == 0) return "Formation & Planning";
        if (completed < milestones.size() / 2.0) return "Development";
        if (completed < milestones.size()) return "Testing & Refinement";
        return "Final Submission";
    }

    private boolean hasActiveMentor(Long teamId) {
        return mentorshipRepository.existsByTeamIdAndStatus(teamId, Mentorship.MentorshipStatus.ACCEPTED);
    }
}
