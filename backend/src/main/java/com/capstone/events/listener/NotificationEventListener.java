package com.capstone.events.listener;

import com.capstone.events.MentorMatchedEvent;
import com.capstone.events.MilestoneSubmittedEvent;
import com.capstone.events.TeamFormedEvent;
import com.capstone.model.*;
import com.capstone.notification.NotificationRequest;
import com.capstone.repository.MentorshipRepository;
import com.capstone.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * ═══════════════════════════════════════════════════════════════════
 * DESIGN PATTERN: Behavioural — Observer Pattern
 *                 (Concrete Observer — NotificationEventListener)
 * ═══════════════════════════════════════════════════════════════════
 *
 * ROLE: Observer (Listener)
 *
 * This listener subscribes to domain events and reacts by sending
 * notifications. It is completely decoupled from the services that
 * publish the events — services never import this class.
 *
 * Adding new notification logic in the future means adding or
 * modifying a listener ONLY — zero changes to business services.
 *
 * PATTERNS COMBINED: Observer (Spring events) + Builder (NotificationRequest)
 * ═══════════════════════════════════════════════════════════════════
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService  notificationService;
    private final MentorshipRepository mentorshipRepository;

    /**
     * Observer reacts to TeamFormedEvent.
     * Notifies the team leader that their team was successfully created.
     */
    @EventListener
    public void onTeamFormed(TeamFormedEvent event) {
        log.info("[Observer] TeamFormedEvent received — team='{}', leader='{}'",
                event.getTeam().getTeamName(), event.getLeader().getName());

        // Notify the leader (Builder Pattern combined with Observer)
        notificationService.send(
                NotificationRequest.to(event.getLeader().getId())
                        .message("🚀 Your team '" + event.getTeam().getTeamName() + "' has been created! Invite your teammates.")
                        .type(Notification.NotificationType.SYSTEM)
                        .reference(event.getTeam().getId(), "TEAM")
                        .build()
        );
    }

    /**
     * Observer reacts to MentorMatchedEvent.
     * Notifies all accepted team members that a mentor has been assigned.
     */
    @EventListener
    public void onMentorMatched(MentorMatchedEvent event) {
        Team team    = event.getTeam();
        User faculty = event.getFaculty();

        log.info("[Observer] MentorMatchedEvent received — team='{}', faculty='{}'",
                team.getTeamName(), faculty.getName());

        team.getMembers().stream()
                .filter(m -> m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED)
                .forEach(m -> notificationService.send(
                        NotificationRequest.to(m.getUser().getId())
                                .message("🎓 " + faculty.getName() + " is now your official mentor for project '"
                                        + team.getProject().getTitle() + "'!")
                                .type(Notification.NotificationType.MENTOR_ACCEPTED)
                                .reference(team.getId(), "TEAM")
                                .build()
                ));
    }

    /**
     * Observer reacts to MilestoneSubmittedEvent.
     * Notifies the assigned mentor that a submission has arrived.
     */
    @EventListener
    public void onMilestoneSubmitted(MilestoneSubmittedEvent event) {
        Team      team      = event.getTeam();
        Milestone milestone = event.getMilestone();

        log.info("[Observer] MilestoneSubmittedEvent received — team='{}', milestone='{}', onTime={}",
                team.getTeamName(), milestone.getTitle(), event.isOnTime());

        // Find active mentor and notify
        mentorshipRepository
                .findByTeamIdAndStatus(team.getId(), Mentorship.MentorshipStatus.ACCEPTED)
                .ifPresent(mentorship -> notificationService.send(
                        NotificationRequest.to(mentorship.getFaculty().getId())
                                .message("📋 Team '" + team.getTeamName() + "' submitted '"
                                        + milestone.getTitle() + "'"
                                        + (event.isOnTime() ? " ✅ on time!" : " ⚠️ late."))
                                .type(Notification.NotificationType.MILESTONE_REVIEWED)
                                .reference(milestone.getId(), "MILESTONE")
                                .build()
                ));
    }
}
