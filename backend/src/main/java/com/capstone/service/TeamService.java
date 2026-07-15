package com.capstone.service;

import com.capstone.dsa.MergeSort;
import com.capstone.events.TeamFormedEvent;
import com.capstone.model.*;
import com.capstone.notification.NotificationRequest;
import com.capstone.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final NotificationService notificationService;

    /** Observer Pattern — publisher that fires domain events to registered listeners */
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Team createTeam(String teamName, Long projectId, Long leaderId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        if (teamRepository.findByProjectId(projectId).isPresent()) {
            throw new RuntimeException("A team already exists for this project");
        }

        Team team = Team.builder()
                .teamName(teamName)
                .project(project)
                .status(Team.TeamStatus.FORMING)
                .lastActivityAt(LocalDateTime.now())
                .build();
        team = teamRepository.save(team);

        // Auto-add creator as ACCEPTED team lead
        User leader = userRepository.findById(leaderId)
                .orElseThrow(() -> new RuntimeException("User not found: " + leaderId));
        TeamMember leadMember = TeamMember.builder()
                .team(team)
                .user(leader)
                .roleInTeam("Team Lead")
                .inviteStatus(TeamMember.InviteStatus.ACCEPTED)
                .build();
        teamMemberRepository.save(leadMember);

        // Create default 3 milestones
        createDefaultMilestones(team);

        // ── Observer Pattern ── Publish TeamFormedEvent; listeners handle
        //    audit logging and notifications independently
        eventPublisher.publishEvent(new TeamFormedEvent(this, team, leader));

        return team;
    }

    @Transactional
    public TeamMember inviteMember(Long teamId, Long inviteeId, Long inviterId) {
        Team team = getTeamById(teamId);
        User invitee = userRepository.findById(inviteeId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, inviteeId)) {
            throw new RuntimeException("User already a member of this team");
        }

        TeamMember member = TeamMember.builder()
                .team(team)
                .user(invitee)
                .inviteStatus(TeamMember.InviteStatus.PENDING)
                .build();
        member = teamMemberRepository.save(member);

        // ── Builder Pattern ── Construct notification via fluent builder
        notificationService.send(
                NotificationRequest.to(inviteeId)
                        .message("You've been invited to join team '" + team.getTeamName() + "'!")
                        .type(Notification.NotificationType.TEAM_INVITE)
                        .reference(teamId, "TEAM")
                        .build()
        );

        return member;
    }

    @Transactional
    public TeamMember respondToInvite(Long teamId, Long userId, boolean accept) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        member.setInviteStatus(accept ? TeamMember.InviteStatus.ACCEPTED : TeamMember.InviteStatus.REJECTED);
        member = teamMemberRepository.save(member);

        if (accept) {
            Team team = member.getTeam();
            team.setLastActivityAt(LocalDateTime.now());
            teamRepository.save(team);
            logEvent(team, member.getUser(), "MEMBER_JOINED", Map.of("userId", userId));
        }

        return member;
    }

    public Team getTeamById(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found: " + teamId));
    }

    public List<Team> getTeamsForUser(Long userId) {
        return teamRepository.findTeamsByMemberId(userId);
    }

    public List<Team> getTeamsForMentor(Long facultyId) {
        return teamRepository.findTeamsByMentorId(facultyId);
    }

    public List<Team> getAtRiskTeams() {
        return teamRepository.findAtRiskTeams();
    }

    @Transactional
    public void addPoints(Long teamId, int points, String reason) {
        Team team = getTeamById(teamId);
        team.setTotalScore(team.getTotalScore() + points);
        team.setLastActivityAt(LocalDateTime.now());
        teamRepository.save(team);
        logEvent(team, null, "POINTS_AWARDED", Map.of("points", points, "reason", reason));
    }

    private void createDefaultMilestones(Team team) {
        String[] titles = {"Review 1 — Proposal & Prototype", "Review 2 — Mid-term Progress", "Final Submission"};
        int[] rewards   = {15, 25, 60};
        for (int i = 0; i < titles.length; i++) {
            Milestone m = Milestone.builder()
                    .team(team)
                    .title(titles[i])
                    .sequenceOrder(i + 1)
                    .status(Milestone.MilestoneStatus.PENDING)
                    .pointsReward(rewards[i])
                    .build();
            milestoneRepository.save(m);
        }
    }

    private void logEvent(Team team, User user, String type, Map<String, Object> data) {
        Event event = Event.builder()
                .team(team)
                .user(user)
                .eventType(type)
                .eventData(data)
                .build();
        eventRepository.save(event);
    }

    /**
     * Leaderboard — sorted by totalScore DESC, then teamName ASC.
     *
     * DSA: Custom MergeSort (O(N log N)) instead of SQL ORDER BY,
     * demonstrating the Java merge sort implementation.
     * Stable sort preserves tie order from DB fetch.
     */
    public List<Team> getLeaderboard() {
        List<Team> allTeams = teamRepository.findAll();

        Comparator<Team> leaderboardOrder = MergeSort.leaderboardComparator(
                Team::getTotalScore,    // int score → descending
                Team::getTeamName       // String name → ascending
        );

        return MergeSort.sort(allTeams, leaderboardOrder);
    }
}
