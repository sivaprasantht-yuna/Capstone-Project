package com.capstone.events;

import com.capstone.model.Team;
import com.capstone.model.User;
import org.springframework.context.ApplicationEvent;

/**
 * ═══════════════════════════════════════════════════════════════════
 * DESIGN PATTERN: Behavioural — Observer Pattern
 *                 (Domain Event — TeamFormedEvent)
 * ═══════════════════════════════════════════════════════════════════
 *
 * This is a concrete "Event" (Subject notification payload) in the
 * Observer pattern, using Spring's ApplicationEvent as the base.
 *
 * PARTICIPANTS:
 *   - Subject (Observable): TeamService  — fires this event
 *   - Event:  TeamFormedEvent            — this class
 *   - Observer:  NotificationEventListener, AuditEventListener
 * ═══════════════════════════════════════════════════════════════════
 */
public class TeamFormedEvent extends ApplicationEvent {

    private final Team team;
    private final User leader;

    public TeamFormedEvent(Object source, Team team, User leader) {
        super(source);
        this.team   = team;
        this.leader = leader;
    }

    public Team getTeam()     { return team; }
    public User getLeader()   { return leader; }
}
