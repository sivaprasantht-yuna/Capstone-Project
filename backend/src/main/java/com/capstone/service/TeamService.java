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
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.capstone.controller.TeamController.CreateTeamRequest;
import com.capstone.controller.TeamController.OpenTeamDto;

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
    public Team createTeamWithProject(CreateTeamRequest req, User leader) {
        String domainStr = "General";
        if (req.getDomains() != null && !req.getDomains().isEmpty()) {
            domainStr = String.join(", ", req.getDomains());
        }

        Project project = Project.builder()
                .title(req.getTeamName() + " Project")
                .description(req.getProjectFocus())
                .domain(domainStr)
                .techStack(req.getRequiredSkills())
                .maxTeamSize(req.getMaxTeamSize() != null ? req.getMaxTeamSize() : 4)
                .postedBy(leader)
                .status(Project.ProjectStatus.OPEN)
                .build();
        
        project = projectRepository.save(project);
        return createTeam(req.getTeamName(), project.getId(), leader.getId());
    }

    @Transactional(readOnly = true)
    public List<OpenTeamDto> getOpenTeams() {
        List<Team> openTeams = teamRepository.findAllOpenTeamsWithDetails();
        ObjectMapper mapper = new ObjectMapper();
        return openTeams.stream().map(team -> {
            Project project = team.getProject();
            List<String> skills = new ArrayList<>();
            try {
                if (project != null && project.getTechStack() != null) {
                    if (project.getTechStack().startsWith("[")) {
                        skills = mapper.readValue(project.getTechStack(), new TypeReference<List<String>>() {});
                    } else {
                        skills = List.of(project.getTechStack().split(",\\s*"));
                    }
                }
            } catch (Exception e) {
                // ignore
            }
            
            List<String> domains = new ArrayList<>();
            if (project != null && project.getDomain() != null) {
                if (project.getDomain().startsWith("[")) {
                    try {
                        domains = mapper.readValue(project.getDomain(), new TypeReference<List<String>>() {});
                    } catch (Exception e) {
                        domains = List.of(project.getDomain().split(",\\s*"));
                    }
                } else {
                    domains = List.of(project.getDomain().split(",\\s*"));
                }
            }

            String leaderName = "Unknown Leader";
            if (team.getMembers() != null) {
                leaderName = team.getMembers().stream()
                        .filter(m -> "Team Lead".equalsIgnoreCase(m.getRoleInTeam()) || "LEADER".equalsIgnoreCase(m.getRoleInTeam()) || (project != null && project.getPostedBy() != null && m.getUser().getId().equals(project.getPostedBy().getId())))
                        .map(m -> m.getUser().getName())
                        .findFirst()
                        .orElse(team.getMembers().isEmpty() ? "Unknown Leader" : team.getMembers().get(0).getUser().getName());
            }

            int memberCount = 1;
            if (team.getMembers() != null) {
                long acceptedCount = team.getMembers().stream()
                        .filter(m -> m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED || m.getInviteStatus() == null)
                        .count();
                memberCount = (int) (acceptedCount > 0 ? acceptedCount : 1);
            }

            return OpenTeamDto.builder()
                    .id(team.getId().toString())
                    .teamName(team.getTeamName())
                    .leaderName(leaderName)
                    .domains(domains)
                    .requiredSkills(skills)
                    .currentMemberCount(memberCount)
                    .maxTeamCount(project != null && project.getMaxTeamSize() != null ? project.getMaxTeamSize() : 4)
                    .projectFocus(project != null ? project.getDescription() : "")
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableStudents(Long currentUserId) {
        // JPQL-level filter: only students NOT already ACCEPTED in any team
        List<User> availableStudents = userRepository.findStudentsWithoutTeam(currentUserId);

        return availableStudents.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId().toString());
            map.put("name", u.getName());
            map.put("department", u.getDepartment() != null ? u.getDepartment() : "Engineering");
            map.put("rollNumber", u.getStudentProfile() != null && u.getStudentProfile().getRollNumber() != null ?
                    u.getStudentProfile().getRollNumber() : ("22" + (u.getDepartment() != null && u.getDepartment().length() >= 2 ? u.getDepartment().substring(0, 2).toUpperCase() : "CS") + String.format("%03d", u.getId())));

            List<String> skills = u.getUserSkills() != null ? u.getUserSkills().stream()
                    .map(us -> us.getSkill() != null ? us.getSkill().getSkillName() : "")
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList()) : new ArrayList<>();
            map.put("skills", skills);
            map.put("avatarInitial", u.getName() != null && !u.getName().isEmpty() ? u.getName().substring(0, 1).toUpperCase() : "S");
            map.put("bio", u.getStudentProfile() != null ? u.getStudentProfile().getBio() : null);
            map.put("yearOfStudy", u.getStudentProfile() != null ? u.getStudentProfile().getYearOfStudy() : null);
            map.put("githubLink", u.getStudentProfile() != null ? u.getStudentProfile().getGithubLink() : null);
            map.put("linkedinLink", u.getStudentProfile() != null ? u.getStudentProfile().getLinkedinLink() : null);
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentProfile(Long studentId) {
        User u = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId().toString());
        map.put("name", u.getName());
        map.put("email", u.getEmail());
        map.put("department", u.getDepartment() != null ? u.getDepartment() : "Engineering");
        map.put("rollNumber", u.getStudentProfile() != null && u.getStudentProfile().getRollNumber() != null ?
                u.getStudentProfile().getRollNumber() : ("22" + (u.getDepartment() != null && u.getDepartment().length() >= 2 ? u.getDepartment().substring(0, 2).toUpperCase() : "CS") + String.format("%03d", u.getId())));
        map.put("bio", u.getStudentProfile() != null ? u.getStudentProfile().getBio() : null);
        map.put("yearOfStudy", u.getStudentProfile() != null ? u.getStudentProfile().getYearOfStudy() : null);
        map.put("githubLink", u.getStudentProfile() != null ? u.getStudentProfile().getGithubLink() : null);
        map.put("linkedinLink", u.getStudentProfile() != null ? u.getStudentProfile().getLinkedinLink() : null);
        map.put("avatarInitial", u.getName() != null && !u.getName().isEmpty() ? u.getName().substring(0, 1).toUpperCase() : "S");

        List<String> skills = u.getUserSkills() != null ? u.getUserSkills().stream()
                .map(us -> us.getSkill() != null ? us.getSkill().getSkillName() : "")
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList()) : new ArrayList<>();
        map.put("skills", skills);

        // Fetch ideas posted by this student
        List<Map<String, Object>> ideas = projectRepository.findByPostedById(studentId).stream()
                .map(p -> {
                    Map<String, Object> idea = new HashMap<>();
                    idea.put("id", p.getId());
                    idea.put("title", p.getTitle());
                    idea.put("description", p.getDescription());
                    idea.put("domain", p.getDomain());
                    idea.put("techStack", p.getTechStack());
                    idea.put("upvoteCount", p.getUpvoteCount());
                    idea.put("status", p.getStatus() != null ? p.getStatus().name() : "OPEN");
                    return idea;
                }).collect(Collectors.toList());
        map.put("ideas", ideas);

        return map;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingRequests(Long teamId) {
        List<TeamMember> pending = teamMemberRepository.findByTeamIdAndInviteStatus(teamId, TeamMember.InviteStatus.PENDING);
        return pending.stream().map(m -> {
            User u = m.getUser();
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId().toString());
            map.put("name", u.getName());
            map.put("department", u.getDepartment() != null ? u.getDepartment() : "Engineering");
            map.put("rollNumber", u.getStudentProfile() != null && u.getStudentProfile().getRollNumber() != null ?
                    u.getStudentProfile().getRollNumber() : ("22" + (u.getDepartment() != null && u.getDepartment().length() >= 2 ? u.getDepartment().substring(0, 2).toUpperCase() : "CS") + String.format("%03d", u.getId())));
            
            List<String> skills = u.getUserSkills() != null ? u.getUserSkills().stream()
                    .map(us -> us.getSkill() != null ? us.getSkill().getSkillName() : "")
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList()) : new ArrayList<>();
            map.put("skills", skills);
            map.put("requestedRole", m.getRoleInTeam() != null ? m.getRoleInTeam() : "Team Member");
            map.put("appliedAt", LocalDateTime.now().toString());
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public TeamMember requestToJoin(Long teamId, Long userId) {
        Team team = getTeamById(teamId);
        User student = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new RuntimeException("Already requested or a member of this team");
        }

        TeamMember member = TeamMember.builder()
                .team(team)
                .user(student)
                .roleInTeam("Team Member")
                .inviteStatus(TeamMember.InviteStatus.PENDING)
                .build();
        return teamMemberRepository.save(member);
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
    public TeamMember respondToJoinRequest(Long teamId, Long applicantUserId, boolean accept) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, applicantUserId)
                .orElseThrow(() -> new RuntimeException("Join request not found for user: " + applicantUserId));

        member.setInviteStatus(accept ? TeamMember.InviteStatus.ACCEPTED : TeamMember.InviteStatus.REJECTED);
        member = teamMemberRepository.save(member);

        if (accept) {
            Team team = member.getTeam();
            team.setLastActivityAt(LocalDateTime.now());
            teamRepository.save(team);
            logEvent(team, member.getUser(), "MEMBER_JOINED", Map.of("userId", applicantUserId));

            notificationService.send(
                    NotificationRequest.to(applicantUserId)
                            .message("Your request to join team '" + team.getTeamName() + "' has been accepted! 🎉")
                            .type(Notification.NotificationType.TEAM_INVITE)
                            .reference(teamId, "TEAM")
                            .build()
            );
        }

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

    @Transactional(readOnly = true)
    public Team getTeamById(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found: " + teamId));
    }

    @Transactional(readOnly = true)
    public List<Team> getTeamsForUser(Long userId) {
        return teamRepository.findTeamsByMemberId(userId);
    }

    @Transactional(readOnly = true)
    public List<Team> getTeamsForMentor(Long facultyId) {
        return teamRepository.findTeamsByMentorId(facultyId);
    }

    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<Team> getLeaderboard() {
        List<Team> allTeams = teamRepository.findAll();

        Comparator<Team> leaderboardOrder = MergeSort.leaderboardComparator(
                Team::getTotalScore,    // int score → descending
                Team::getTeamName       // String name → ascending
        );

        return MergeSort.sort(allTeams, leaderboardOrder);
    }
}
