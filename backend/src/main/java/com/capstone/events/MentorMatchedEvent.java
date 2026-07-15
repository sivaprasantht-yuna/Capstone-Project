package com.capstone.events;

import com.capstone.model.Mentorship;
import com.capstone.model.Team;
import com.capstone.model.User;
import org.springframework.context.ApplicationEvent;

/**
 * ═══════════════════════════════════════════════════════════════════
 * DESIGN PATTERN: Behavioural — Observer Pattern
 *                 (Domain Event — MentorMatchedEvent)
 * ═══════════════════════════════════════════════════════════════════
 *
 * Fired by MentorshipService when a faculty member accepts a team's
 * mentorship request. Listeners react independently — neither the
 * service nor this event knows who is listening.
 * ═══════════════════════════════════════════════════════════════════
 */
public class MentorMatchedEvent extends ApplicationEvent {

    private final Team       team;
    private final User       faculty;
    private final Mentorship mentorship;

    public MentorMatchedEvent(Object source, Team team, User faculty, Mentorship mentorship) {
        super(source);
        this.team       = team;
        this.faculty    = faculty;
        this.mentorship = mentorship;
    }

    public Team       getTeam()       { return team; }
    public User       getFaculty()    { return faculty; }
    public Mentorship getMentorship() { return mentorship; }
}
