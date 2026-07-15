package com.capstone.service;

import com.capstone.events.MentorMatchedEvent;
import com.capstone.model.*;
import com.capstone.notification.NotificationRequest;
import com.capstone.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MentorshipService {

    private final MentorshipRepository mentorshipRepository;
    private final TeamRepository teamRepository;
    private final FacultyProfileRepository facultyProfileRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final NotificationService notificationService;

    /** Observer Pattern — publisher that fires domain events to registered listeners */
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Mentorship requestMentor(Long teamId, Long facultyId, Double matchScore, String matchingSkillsJson) {
        if (mentorshipRepository.existsByTeamIdAndFacultyIdAndStatus(teamId, facultyId, Mentorship.MentorshipStatus.PENDING)) {
            throw new RuntimeException("A pending request already exists for this faculty");
        }
        if (mentorshipRepository.existsByTeamIdAndFacultyIdAndStatus(teamId, facultyId, Mentorship.MentorshipStatus.ACCEPTED)) {
            throw new RuntimeException("This faculty is already your mentor");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        Mentorship mentorship = Mentorship.builder()
                .team(team)
                .faculty(faculty)
                .matchScore(matchScore)
                .matchingSkillsJson(matchingSkillsJson)
                .status(Mentorship.MentorshipStatus.PENDING)
                .build();
        mentorship = mentorshipRepository.save(mentorship);

        // ── Builder Pattern ── Construct mentor request notification
        notificationService.send(
                NotificationRequest.to(facultyId)
                        .message("Team '" + team.getTeamName() + "' has requested you as their mentor (match score: " +
                                String.format("%.0f%%", (matchScore != null ? matchScore : 0) * 100) + ").")
                        .type(Notification.NotificationType.MENTOR_REQUEST)
                        .reference(teamId, "TEAM")
                        .build()
        );

        logEvent(team, faculty, "MENTOR_REQUESTED", Map.of("facultyId", facultyId, "matchScore", matchScore != null ? matchScore : 0));
        return mentorship;
    }

    @Transactional
    public Mentorship respondToRequest(Long mentorshipId, Long facultyId, boolean accept) {
        Mentorship mentorship = mentorshipRepository.findById(mentorshipId)
                .orElseThrow(() -> new RuntimeException("Mentorship request not found"));

        if (!mentorship.getFaculty().getId().equals(facultyId)) {
            throw new RuntimeException("Unauthorized: not your mentorship request");
        }

        mentorship.setStatus(accept ? Mentorship.MentorshipStatus.ACCEPTED : Mentorship.MentorshipStatus.REJECTED);
        final Mentorship savedMentorship = mentorshipRepository.save(mentorship);
        final String facultyName = savedMentorship.getFaculty().getName();
        final Team team = savedMentorship.getTeam();

        if (accept) {
            // Update team status + faculty load counter
            team.setStatus(Team.TeamStatus.ACTIVE);
            teamRepository.save(team);

            facultyProfileRepository.findById(facultyId).ifPresent(fp -> {
                fp.setCurrentTeamCount(fp.getCurrentTeamCount() + 1);
                facultyProfileRepository.save(fp);
            });

            // ── Builder Pattern ── Notify all team members of acceptance
            team.getMembers().stream()
                    .filter(m -> m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED)
                    .forEach(m -> notificationService.send(
                            NotificationRequest.to(m.getUser().getId())
                                    .message("🎉 " + facultyName + " has accepted to be your mentor!")
                                    .type(Notification.NotificationType.MENTOR_ACCEPTED)
                                    .reference(team.getId(), "TEAM")
                                    .build()
                    ));

            // ── Observer Pattern ── Publish event; AuditEventListener logs it
            eventPublisher.publishEvent(
                    new MentorMatchedEvent(this, team, savedMentorship.getFaculty(), savedMentorship)
            );
        } else {
            // ── Builder Pattern ── Notify all team members of rejection
            team.getMembers().stream()
                    .filter(m -> m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED)
                    .forEach(m -> notificationService.send(
                            NotificationRequest.to(m.getUser().getId())
                                    .message(facultyName + " declined your mentorship request. Please try another mentor.")
                                    .type(Notification.NotificationType.MENTOR_REJECTED)
                                    .reference(team.getId(), "TEAM")
                                    .build()
                    ));
        }

        return savedMentorship;
    }

    @Transactional
    public Mentorship submitRating(Long mentorshipId, Long raterId, Integer rating, boolean isTeamRating) {
        Mentorship mentorship = mentorshipRepository.findById(mentorshipId)
                .orElseThrow(() -> new RuntimeException("Mentorship not found"));

        if (isTeamRating) {
            mentorship.setTeamRatingForMentor(rating);
            // Update faculty's rolling average
            facultyProfileRepository.findById(mentorship.getFaculty().getId()).ifPresent(fp -> {
                int total = fp.getTotalRatings();
                double avg = fp.getMentorRating();
                fp.setMentorRating((avg * total + rating) / (total + 1));
                fp.setTotalRatings(total + 1);
                facultyProfileRepository.save(fp);
            });
        } else {
            mentorship.setMentorRatingForTeam(rating);
        }

        return mentorshipRepository.save(mentorship);
    }

    public List<Mentorship> getPendingRequestsForFaculty(Long facultyId) {
        return mentorshipRepository.findByFacultyIdAndStatus(facultyId, Mentorship.MentorshipStatus.PENDING);
    }

    public List<Mentorship> getActiveMentorshipsForFaculty(Long facultyId) {
        return mentorshipRepository.findByFacultyIdAndStatus(facultyId, Mentorship.MentorshipStatus.ACCEPTED);
    }

    private void logEvent(Team team, User user, String type, Map<String, Object> data) {
        Event event = Event.builder().team(team).user(user).eventType(type).eventData(data).build();
        eventRepository.save(event);
    }
}
