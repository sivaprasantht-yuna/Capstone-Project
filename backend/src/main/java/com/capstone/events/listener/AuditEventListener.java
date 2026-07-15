package com.capstone.events.listener;

import com.capstone.events.MentorMatchedEvent;
import com.capstone.events.MilestoneSubmittedEvent;
import com.capstone.events.TeamFormedEvent;
import com.capstone.model.Event;
import com.capstone.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * ═══════════════════════════════════════════════════════════════════
 * DESIGN PATTERN: Behavioural — Observer Pattern
 *                 (Concrete Observer — AuditEventListener)
 * ═══════════════════════════════════════════════════════════════════
 *
 * ROLE: Observer (Listener) — handles audit logging
 *
 * This listener subscribes to the same domain events as
 * NotificationEventListener but handles AUDIT TRAIL concerns.
 *
 * KEY INSIGHT: The same event can have multiple independent observers.
 * TeamService.createTeam() fires ONE event — BOTH this listener AND
 * NotificationEventListener react independently. No coupling between them.
 *
 * Previously, audit logging was hardcoded inline in every service method.
 * Now it lives here — a single change point for all audit behaviour.
 * ═══════════════════════════════════════════════════════════════════
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditEventListener {

    private final EventRepository eventRepository;

    /**
     * Observer reacts to TeamFormedEvent — saves an audit log entry.
     */
    @EventListener
    public void auditTeamFormed(TeamFormedEvent event) {
        log.debug("[Observer/Audit] Logging TEAM_FORMED for team='{}'", event.getTeam().getTeamName());

        eventRepository.save(
                Event.builder()
                        .team(event.getTeam())
                        .user(event.getLeader())
                        .eventType("TEAM_FORMED")
                        .eventData(Map.of(
                                "teamName",  event.getTeam().getTeamName(),
                                "projectId", event.getTeam().getProject().getId()
                        ))
                        .build()
        );
    }

    /**
     * Observer reacts to MentorMatchedEvent — saves an audit log entry.
     */
    @EventListener
    public void auditMentorMatched(MentorMatchedEvent event) {
        log.debug("[Observer/Audit] Logging MENTOR_MATCHED for team='{}', faculty='{}'",
                event.getTeam().getTeamName(), event.getFaculty().getName());

        eventRepository.save(
                Event.builder()
                        .team(event.getTeam())
                        .user(event.getFaculty())
                        .eventType("MENTOR_MATCHED")
                        .eventData(Map.of(
                                "facultyId", event.getFaculty().getId(),
                                "teamId",    event.getTeam().getId()
                        ))
                        .build()
        );
    }

    /**
     * Observer reacts to MilestoneSubmittedEvent — saves an audit log entry.
     */
    @EventListener
    public void auditMilestoneSubmitted(MilestoneSubmittedEvent event) {
        log.debug("[Observer/Audit] Logging MILESTONE_SUBMITTED for team='{}', milestone='{}'",
                event.getTeam().getTeamName(), event.getMilestone().getTitle());

        eventRepository.save(
                Event.builder()
                        .team(event.getTeam())
                        .user(event.getSubmitter())
                        .eventType("MILESTONE_SUBMITTED")
                        .eventData(Map.of(
                                "milestoneId", event.getMilestone().getId(),
                                "onTime",      event.isOnTime()
                        ))
                        .build()
        );
    }
}
