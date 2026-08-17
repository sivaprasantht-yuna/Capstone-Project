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
    private final MentorshipRepository mentorshipRepository;
    private final TeamDismantleRequestRepository dismantleRequestRepository;
    private final MemberRemovalRequestRepository removalRequestRepository;
    private final StudentContributionRepository contributionRepository;

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

    // ─── Team Dismantle (pre-mentor: direct) ──────────────────────────────────

    @Transactional
    public Team dismantleTeamDirect(Long teamId, Long leaderId, String reason) {
        Team team = validateLeaderAction(teamId, leaderId);
        if (hasMentor(teamId)) {
            throw new RuntimeException("Mentor approval is required to dismantle this team.");
        }
        if (team.getStatus() == Team.TeamStatus.DISSOLVED) {
            throw new RuntimeException("This team has already been dissolved.");
        }
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("A reason is required to dismantle the team.");
        }

        team.setStatus(Team.TeamStatus.DISSOLVED);
        team.setDismantleReason(reason);
        team.setDismantledAt(LocalDateTime.now());
        final Team savedTeam = teamRepository.save(team);

        // Mark all members as FORMER
        savedTeam.getMembers().stream()
                .filter(m -> m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED)
                .forEach(m -> {
                    m.setMembershipStatus(TeamMember.MembershipStatus.FORMER_MEMBER);
                    teamMemberRepository.save(m);
                    // Update contribution record
                    contributionRepository.findByTeamIdAndStudentId(teamId, m.getUser().getId())
                            .ifPresent(c -> {
                                c.setMembershipStatus(StudentContribution.MembershipStatus.FORMER);
                                contributionRepository.save(c);
                            });
                    // Notify
                    if (!m.getUser().getId().equals(leaderId)) {
                        notificationService.send(
                                NotificationRequest.to(m.getUser().getId())
                                        .message("⚠️ Team '" + savedTeam.getTeamName() + "' has been dissolved by the team leader.")
                                        .type(Notification.NotificationType.TEAM_DISSOLVED)
                                        .reference(teamId, "TEAM")
                                        .build()
                        );
                    }
                });

        logEvent(savedTeam, userRepository.findById(leaderId).orElse(null), "TEAM_DISSOLVED",
                Map.of("reason", reason, "dismantledBy", leaderId));
        return savedTeam;
    }

    // ─── Team Dismantle (post-mentor: request) ────────────────────────────────

    @Transactional
    public TeamDismantleRequest requestTeamDismantle(Long teamId, Long leaderId, String reason) {
        Team team = validateLeaderAction(teamId, leaderId);
        if (!hasMentor(teamId)) {
            throw new RuntimeException("No mentor assigned. You can dismantle directly.");
        }
        if (team.getStatus() == Team.TeamStatus.DISSOLVED) {
            throw new RuntimeException("This team has already been dissolved.");
        }
        if (dismantleRequestRepository.existsByTeamIdAndStatus(teamId, TeamDismantleRequest.DismantleRequestStatus.PENDING)) {
            throw new RuntimeException("A dismantle request is already pending.");
        }
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("A reason is required.");
        }

        User leader = userRepository.findById(leaderId).orElseThrow();
        TeamDismantleRequest request = TeamDismantleRequest.builder()
                .team(team)
                .requestedBy(leader)
                .reason(reason)
                .status(TeamDismantleRequest.DismantleRequestStatus.PENDING)
                .build();
        request = dismantleRequestRepository.save(request);

        team.setStatus(Team.TeamStatus.DISMANTLE_REQUESTED);
        teamRepository.save(team);

        // Notify mentor
        Mentorship mentorship = mentorshipRepository
                .findByTeamIdAndStatus(teamId, Mentorship.MentorshipStatus.ACCEPTED).orElse(null);
        if (mentorship != null) {
            notificationService.send(
                    NotificationRequest.to(mentorship.getFaculty().getId())
                            .message("🔔 Team '" + team.getTeamName() + "' has requested to be dissolved. Reason: " + reason)
                            .type(Notification.NotificationType.TEAM_DISMANTLE_REQUEST)
                            .reference(teamId, "TEAM")
                            .build()
            );
        }

        logEvent(team, leader, "DISMANTLE_REQUESTED", Map.of("reason", reason));
        return request;
    }

    @Transactional
    public Team approveDismantleRequest(Long requestId, Long mentorId, String comment) {
        TeamDismantleRequest request = dismantleRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (request.getStatus() != TeamDismantleRequest.DismantleRequestStatus.PENDING) {
            throw new RuntimeException("This request has already been processed.");
        }

        User mentor = userRepository.findById(mentorId).orElseThrow();
        request.setStatus(TeamDismantleRequest.DismantleRequestStatus.APPROVED);
        request.setMentorComment(comment);
        request.setResolvedBy(mentor);
        request.setResolvedAt(LocalDateTime.now());
        dismantleRequestRepository.save(request);

        Team team = request.getTeam();
        team.setStatus(Team.TeamStatus.DISSOLVED);
        team.setDismantleReason(request.getReason());
        team.setDismantledAt(LocalDateTime.now());
        teamRepository.save(team);

        // Notify all members
        team.getMembers().stream()
                .filter(m -> m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED)
                .forEach(m -> {
                    m.setMembershipStatus(TeamMember.MembershipStatus.FORMER_MEMBER);
                    teamMemberRepository.save(m);
                    notificationService.send(
                            NotificationRequest.to(m.getUser().getId())
                                    .message("⚠️ Team '" + team.getTeamName() + "' has been dissolved by mentor approval.")
                                    .type(Notification.NotificationType.TEAM_DISSOLVED)
                                    .reference(team.getId(), "TEAM")
                                    .build()
                    );
                });

        logEvent(team, mentor, "DISMANTLE_APPROVED", Map.of("requestId", requestId));
        return team;
    }

    @Transactional
    public TeamDismantleRequest rejectDismantleRequest(Long requestId, Long mentorId, String comment) {
        TeamDismantleRequest request = dismantleRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (request.getStatus() != TeamDismantleRequest.DismantleRequestStatus.PENDING) {
            throw new RuntimeException("This request has already been processed.");
        }

        User mentor = userRepository.findById(mentorId).orElseThrow();
        request.setStatus(TeamDismantleRequest.DismantleRequestStatus.REJECTED);
        request.setMentorComment(comment);
        request.setResolvedBy(mentor);
        request.setResolvedAt(LocalDateTime.now());
        dismantleRequestRepository.save(request);

        // Restore team status to MENTOR_ASSIGNED
        Team team = request.getTeam();
        team.setStatus(Team.TeamStatus.MENTOR_ASSIGNED);
        teamRepository.save(team);

        // Notify leader
        notificationService.send(
                NotificationRequest.to(request.getRequestedBy().getId())
                        .message("❌ Dismantle request for '" + team.getTeamName() + "' was rejected by mentor. " +
                                (comment != null ? "Comment: " + comment : ""))
                        .type(Notification.NotificationType.DISMANTLE_REJECTED)
                        .reference(team.getId(), "TEAM")
                        .build()
        );

        logEvent(team, mentor, "DISMANTLE_REJECTED", Map.of("requestId", requestId));
        return request;
    }

    // ─── Member Removal (pre-mentor: direct) ──────────────────────────────────

    @Transactional
    public TeamMember removeMemberDirect(Long teamId, Long memberId, Long leaderId, String reason) {
        Team team = validateLeaderAction(teamId, leaderId);
        if (hasMentor(teamId)) {
            throw new RuntimeException("Mentor approval is required to remove a member.");
        }
        if (memberId.equals(leaderId)) {
            throw new RuntimeException("You cannot remove yourself as the team leader.");
        }
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("A reason is required to remove a member.");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)
                .orElseThrow(() -> new RuntimeException("Member not found in this team."));
        if (member.getInviteStatus() != TeamMember.InviteStatus.ACCEPTED) {
            throw new RuntimeException("This user is not an active team member.");
        }

        member.setMembershipStatus(TeamMember.MembershipStatus.REMOVED);
        member.setRemovalReason(reason);
        member.setRemovedAt(LocalDateTime.now());
        member = teamMemberRepository.save(member);

        // Preserve contribution history — mark as FORMER
        contributionRepository.findByTeamIdAndStudentId(teamId, memberId).ifPresent(c -> {
            c.setMembershipStatus(StudentContribution.MembershipStatus.FORMER);
            contributionRepository.save(c);
        });

        // Notify removed member
        notificationService.send(
                NotificationRequest.to(memberId)
                        .message("You have been removed from team '" + team.getTeamName() + "'. Reason: " + reason)
                        .type(Notification.NotificationType.MEMBER_REMOVED)
                        .reference(teamId, "TEAM")
                        .build()
        );

        logEvent(team, userRepository.findById(leaderId).orElse(null), "MEMBER_REMOVED",
                Map.of("removedUserId", memberId, "reason", reason));
        return member;
    }

    // ─── Member Removal (post-mentor: request) ────────────────────────────────

    @Transactional
    public MemberRemovalRequest requestMemberRemoval(Long teamId, Long memberId, Long leaderId, String reason) {
        Team team = validateLeaderAction(teamId, leaderId);
        if (!hasMentor(teamId)) {
            throw new RuntimeException("No mentor assigned. You can remove directly.");
        }
        if (memberId.equals(leaderId)) {
            throw new RuntimeException("You cannot request removal of yourself.");
        }
        if (removalRequestRepository.existsByTeamIdAndTargetMemberIdAndStatus(
                teamId, memberId, MemberRemovalRequest.RemovalRequestStatus.PENDING)) {
            throw new RuntimeException("A removal request for this member is already pending.");
        }
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("A reason is required.");
        }

        User leader = userRepository.findById(leaderId).orElseThrow();
        User targetMember = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        TeamMember membership = teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)
                .orElseThrow(() -> new RuntimeException("Member not found in this team"));
        membership.setMembershipStatus(TeamMember.MembershipStatus.REMOVAL_REQUESTED);
        teamMemberRepository.save(membership);

        MemberRemovalRequest request = MemberRemovalRequest.builder()
                .team(team)
                .targetMember(targetMember)
                .requestedBy(leader)
                .reason(reason)
                .status(MemberRemovalRequest.RemovalRequestStatus.PENDING)
                .build();
        request = removalRequestRepository.save(request);

        // Notify mentor
        Mentorship mentorship = mentorshipRepository
                .findByTeamIdAndStatus(teamId, Mentorship.MentorshipStatus.ACCEPTED).orElse(null);
        if (mentorship != null) {
            notificationService.send(
                    NotificationRequest.to(mentorship.getFaculty().getId())
                            .message("🔔 Team leader requests removal of " + targetMember.getName() +
                                    " from '" + team.getTeamName() + "'. Reason: " + reason)
                            .type(Notification.NotificationType.MEMBER_REMOVAL_REQUEST)
                            .reference(teamId, "TEAM")
                            .build()
            );
        }

        // Notify target member
        notificationService.send(
                NotificationRequest.to(memberId)
                        .message("⚠️ A removal request has been submitted for you in team '" + team.getTeamName() + "'. Awaiting mentor review.")
                        .type(Notification.NotificationType.MEMBER_REMOVAL_REQUEST)
                        .reference(teamId, "TEAM")
                        .build()
        );

        logEvent(team, leader, "REMOVAL_REQUESTED", Map.of("targetMemberId", memberId, "reason", reason));
        return request;
    }

    @Transactional
    public TeamMember approveRemovalRequest(Long requestId, Long mentorId, String comment) {
        MemberRemovalRequest request = removalRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (request.getStatus() != MemberRemovalRequest.RemovalRequestStatus.PENDING) {
            throw new RuntimeException("This request has already been processed.");
        }

        User mentor = userRepository.findById(mentorId).orElseThrow();
        request.setStatus(MemberRemovalRequest.RemovalRequestStatus.APPROVED);
        request.setMentorComment(comment);
        request.setResolvedBy(mentor);
        request.setResolvedAt(LocalDateTime.now());
        removalRequestRepository.save(request);

        Long teamId = request.getTeam().getId();
        Long memberId = request.getTargetMember().getId();

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)
                .orElseThrow();
        member.setMembershipStatus(TeamMember.MembershipStatus.REMOVED);
        member.setRemovalReason(request.getReason());
        member.setRemovedAt(LocalDateTime.now());
        teamMemberRepository.save(member);

        // Preserve contribution history
        contributionRepository.findByTeamIdAndStudentId(teamId, memberId).ifPresent(c -> {
            c.setMembershipStatus(StudentContribution.MembershipStatus.FORMER);
            contributionRepository.save(c);
        });

        // Notify removed member
        notificationService.send(
                NotificationRequest.to(memberId)
                        .message("You have been removed from team '" + request.getTeam().getTeamName() +
                                "' following mentor review." + (comment != null ? " Mentor note: " + comment : ""))
                        .type(Notification.NotificationType.MEMBER_REMOVED)
                        .reference(teamId, "TEAM")
                        .build()
        );

        logEvent(request.getTeam(), mentor, "REMOVAL_APPROVED", Map.of("requestId", requestId, "memberId", memberId));
        return member;
    }

    @Transactional
    public MemberRemovalRequest rejectRemovalRequest(Long requestId, Long mentorId, String comment) {
        MemberRemovalRequest request = removalRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (request.getStatus() != MemberRemovalRequest.RemovalRequestStatus.PENDING) {
            throw new RuntimeException("This request has already been processed.");
        }

        User mentor = userRepository.findById(mentorId).orElseThrow();
        request.setStatus(MemberRemovalRequest.RemovalRequestStatus.REJECTED);
        request.setMentorComment(comment);
        request.setResolvedBy(mentor);
        request.setResolvedAt(LocalDateTime.now());
        removalRequestRepository.save(request);

        // Restore member status
        teamMemberRepository.findByTeamIdAndUserId(request.getTeam().getId(), request.getTargetMember().getId())
                .ifPresent(m -> {
                    m.setMembershipStatus(TeamMember.MembershipStatus.ACTIVE);
                    teamMemberRepository.save(m);
                });

        // Notify leader
        notificationService.send(
                NotificationRequest.to(request.getRequestedBy().getId())
                        .message("❌ Removal request for " + request.getTargetMember().getName() +
                                " was rejected by mentor. " + (comment != null ? "Comment: " + comment : ""))
                        .type(Notification.NotificationType.REMOVAL_REQUEST_REJECTED)
                        .reference(request.getTeam().getId(), "TEAM")
                        .build()
        );

        logEvent(request.getTeam(), mentor, "REMOVAL_REJECTED", Map.of("requestId", requestId));
        return request;
    }

    // ─── Cancel Invitation ────────────────────────────────────────────────────

    @Transactional
    public void cancelInvitation(Long teamId, Long inviteeId, Long leaderId) {
        validateLeaderAction(teamId, leaderId);
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, inviteeId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));
        if (member.getInviteStatus() != TeamMember.InviteStatus.PENDING) {
            throw new RuntimeException("This invitation cannot be cancelled (not pending).");
        }
        member.setInviteStatus(TeamMember.InviteStatus.CANCELLED);
        teamMemberRepository.save(member);

        notificationService.send(
                NotificationRequest.to(inviteeId)
                        .message("Your team invitation has been cancelled.")
                        .type(Notification.NotificationType.INVITATION_CANCELLED)
                        .reference(teamId, "TEAM")
                        .build()
        );
    }

    // ─── Override inviteMember to add message + validations ──────────────────

    @Transactional
    public TeamMember inviteMemberWithMessage(Long teamId, Long inviteeId, Long inviterId, String message) {
        Team team = getTeamById(teamId);
        if (team.getStatus() == Team.TeamStatus.DISSOLVED) {
            throw new RuntimeException("Cannot invite to a dissolved team.");
        }
        Project project = team.getProject();
        if (project != null) {
            long acceptedCount = team.getMembers().stream()
                    .filter(m -> m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED
                            && m.getMembershipStatus() == TeamMember.MembershipStatus.ACTIVE)
                    .count();
            if (project.getMaxTeamSize() != null && acceptedCount >= project.getMaxTeamSize()) {
                throw new RuntimeException("Team has reached its maximum capacity of " + project.getMaxTeamSize() + " members.");
            }
            boolean pendingExists = team.getMembers().stream()
                    .anyMatch(m -> m.getUser().getId().equals(inviteeId)
                            && m.getInviteStatus() == TeamMember.InviteStatus.PENDING);
            if (pendingExists) {
                throw new RuntimeException("An invitation for this student is already pending.");
            }
        }

        User invitee = userRepository.findById(inviteeId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean activeOrAccepted = team.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(inviteeId)
                        && m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED
                        && m.getMembershipStatus() == TeamMember.MembershipStatus.ACTIVE);
        if (activeOrAccepted) {
            throw new RuntimeException("This student is already an active member of this team.");
        }

        TeamMember member = TeamMember.builder()
                .team(team)
                .user(invitee)
                .inviteStatus(TeamMember.InviteStatus.PENDING)
                .inviteMessage(message)
                .membershipStatus(TeamMember.MembershipStatus.ACTIVE)
                .build();
        member = teamMemberRepository.save(member);

        notificationService.send(
                NotificationRequest.to(inviteeId)
                        .message("You've been invited to join team '" + team.getTeamName() + "'!" +
                                (message != null && !message.isBlank() ? " Message: " + message : ""))
                        .type(Notification.NotificationType.TEAM_INVITE)
                        .reference(teamId, "TEAM")
                        .build()
        );

        return member;
    }

    // ─── Pending governance requests (for mentor dashboard) ──────────────────

    @Transactional(readOnly = true)
    public List<TeamDismantleRequest> getPendingDismantleRequests() {
        return dismantleRequestRepository.findByStatusOrderByRequestedAtAsc(
                TeamDismantleRequest.DismantleRequestStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<MemberRemovalRequest> getPendingRemovalRequests() {
        return removalRequestRepository.findByStatusOrderByRequestedAtAsc(
                MemberRemovalRequest.RemovalRequestStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<TeamDismantleRequest> getDismantleRequestsForTeam(Long teamId) {
        return dismantleRequestRepository.findByTeamIdOrderByRequestedAtDesc(teamId);
    }

    @Transactional(readOnly = true)
    public List<MemberRemovalRequest> getRemovalRequestsForTeam(Long teamId) {
        return removalRequestRepository.findByTeamIdOrderByRequestedAtDesc(teamId);
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    private boolean hasMentor(Long teamId) {
        return mentorshipRepository.existsByTeamIdAndStatus(teamId, Mentorship.MentorshipStatus.ACCEPTED);
    }

    private Team validateLeaderAction(Long teamId, Long userId) {
        Team team = getTeamById(teamId);
        boolean isLeader = team.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(userId)
                        && "Team Lead".equalsIgnoreCase(m.getRoleInTeam())
                        && m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED);
        // Also check if user is the project poster
        if (!isLeader && team.getProject() != null && team.getProject().getPostedBy() != null) {
            isLeader = team.getProject().getPostedBy().getId().equals(userId);
        }
        if (!isLeader) {
            throw new RuntimeException("You are not the Team Leader.");
        }
        return team;
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

