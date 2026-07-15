package com.capstone.service;

import com.capstone.model.*;
import com.capstone.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Nightly background job that:
 * 1. Flags teams with no event activity in the last 7 days as "at risk"
 * 2. Marks overdue milestones with OVERDUE status
 * 3. Sends notifications to team members and their mentor
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AtRiskDetectionService {

    private static final int INACTIVITY_DAYS = 7;

    private final TeamRepository teamRepository;
    private final MilestoneRepository milestoneRepository;
    private final EventRepository eventRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MentorshipRepository mentorshipRepository;
    private final NotificationService notificationService;

    /**
     * Runs every night at 2:00 AM (cron: 0 0 2 * * *)
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void runAtRiskDetection() {
        log.info("=== At-Risk Detection Cron Started ===");

        detectInactiveTeams();
        detectOverdueMilestones();

        log.info("=== At-Risk Detection Cron Completed ===");
    }

    private void detectInactiveTeams() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(INACTIVITY_DAYS);

        // Find active teams where last recorded event is older than threshold
        List<Long> inactiveTeamIds = eventRepository.findTeamIdsWithNoActivitySince(threshold);

        for (Long teamId : inactiveTeamIds) {
            teamRepository.findById(teamId).ifPresent(team -> {
                if (team.getStatus() == Team.TeamStatus.ACTIVE && !team.getIsAtRisk()) {
                    team.setIsAtRisk(true);
                    teamRepository.save(team);

                    // Notify all accepted members
                    List<TeamMember> members = teamMemberRepository
                            .findByTeamIdAndInviteStatus(teamId, TeamMember.InviteStatus.ACCEPTED);
                    for (TeamMember tm : members) {
                        notificationService.sendNotification(
                                tm.getUser().getId(),
                                "⚠️ Your team '" + team.getTeamName() + "' has been flagged as AT RISK due to " + INACTIVITY_DAYS + " days of inactivity.",
                                Notification.NotificationType.AT_RISK_FLAG,
                                teamId, "TEAM"
                        );
                    }

                    // Notify mentor
                    mentorshipRepository
                            .findByTeamIdAndStatus(teamId, Mentorship.MentorshipStatus.ACCEPTED)
                            .ifPresent(m -> notificationService.sendNotification(
                                    m.getFaculty().getId(),
                                    "⚠️ Team '" + team.getTeamName() + "' (which you mentor) has been flagged AT RISK — no activity in " + INACTIVITY_DAYS + " days.",
                                    Notification.NotificationType.AT_RISK_FLAG,
                                    teamId, "TEAM"
                            ));

                    log.warn("Team {} ('{}') flagged as AT RISK", teamId, team.getTeamName());
                }
            });
        }
    }

    private void detectOverdueMilestones() {
        LocalDate today = LocalDate.now();
        List<Milestone> overdue = milestoneRepository.findOverdueMilestones(today);

        for (Milestone m : overdue) {
            m.setStatus(Milestone.MilestoneStatus.OVERDUE);
            milestoneRepository.save(m);

            // Notify team members
            teamMemberRepository
                    .findByTeamIdAndInviteStatus(m.getTeam().getId(), TeamMember.InviteStatus.ACCEPTED)
                    .forEach(tm -> notificationService.sendNotification(
                            tm.getUser().getId(),
                            "⏰ Milestone '" + m.getTitle() + "' is overdue! Due date was " + m.getDueDate() + ".",
                            Notification.NotificationType.MILESTONE_DUE,
                            m.getId(), "MILESTONE"
                    ));

            log.warn("Milestone {} ('{}') for team {} marked OVERDUE", m.getId(), m.getTitle(), m.getTeam().getId());
        }
    }
}
