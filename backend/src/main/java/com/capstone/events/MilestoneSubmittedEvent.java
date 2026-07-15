package com.capstone.events;

import com.capstone.model.Milestone;
import com.capstone.model.Submission;
import com.capstone.model.Team;
import com.capstone.model.User;
import org.springframework.context.ApplicationEvent;

/**
 * ═══════════════════════════════════════════════════════════════════
 * DESIGN PATTERN: Behavioural — Observer Pattern
 *                 (Domain Event — MilestoneSubmittedEvent)
 * ═══════════════════════════════════════════════════════════════════
 *
 * Fired by MilestoneService when a team submits a milestone.
 * Listeners handle notifications, audit logging, and point awards
 * independently — MilestoneService is fully decoupled from them.
 * ═══════════════════════════════════════════════════════════════════
 */
public class MilestoneSubmittedEvent extends ApplicationEvent {

    private final Milestone  milestone;
    private final Submission submission;
    private final Team       team;
    private final User       submitter;
    private final boolean    onTime;

    public MilestoneSubmittedEvent(Object source, Milestone milestone, Submission submission,
                                   Team team, User submitter, boolean onTime) {
        super(source);
        this.milestone  = milestone;
        this.submission = submission;
        this.team       = team;
        this.submitter  = submitter;
        this.onTime     = onTime;
    }

    public Milestone  getMilestone()  { return milestone; }
    public Submission getSubmission() { return submission; }
    public Team       getTeam()       { return team; }
    public User       getSubmitter()  { return submitter; }
    public boolean    isOnTime()      { return onTime; }
}
