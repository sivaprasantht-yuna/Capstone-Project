package com.capstone.service;

import com.capstone.events.MilestoneSubmittedEvent;
import com.capstone.model.*;
import com.capstone.notification.NotificationRequest;
import com.capstone.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final SubmissionRepository submissionRepository;
    private final EvaluationRepository evaluationRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final NotificationService notificationService;
    private final CloudinaryService cloudinaryService;
    private final TeamService teamService;
    private final MentorshipRepository mentorshipRepository;

    /** Observer Pattern — publisher that fires domain events to registered listeners */
    private final ApplicationEventPublisher eventPublisher;

    public List<Milestone> getMilestonesForTeam(Long teamId) {
        return milestoneRepository.findByTeamIdOrderBySequenceOrder(teamId);
    }

    @Transactional
    public Submission submitMilestone(Long milestoneId, Long userId,
                                       String remarks, String githubUrl,
                                       MultipartFile file) throws IOException {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));
        User submitter = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String fileUrl = null;
        String fileName = null;
        if (file != null && !file.isEmpty()) {
            fileUrl  = cloudinaryService.uploadFile(file, "submissions");
            fileName = file.getOriginalFilename();
        }

        Submission submission = Submission.builder()
                .milestone(milestone)
                .submittedBy(submitter)
                .fileUrl(fileUrl)
                .fileName(fileName)
                .githubUrl(githubUrl)
                .remarks(remarks)
                .build();
        submission = submissionRepository.save(submission);

        // Update milestone status
        boolean isOnTime = milestone.getDueDate() == null ||
                !java.time.LocalDate.now().isAfter(milestone.getDueDate());
        milestone.setStatus(Milestone.MilestoneStatus.SUBMITTED);
        milestone.setSubmittedAt(LocalDateTime.now());
        milestoneRepository.save(milestone);

        // Team activity update
        Team team = milestone.getTeam();
        team.setLastActivityAt(LocalDateTime.now());
        team.setIsAtRisk(false);  // submitting clears at-risk flag
        teamRepository.save(team);

        // Gamification: award points
        if (isOnTime) {
            teamService.addPoints(team.getId(), milestone.getPointsReward(), "On-time submission of: " + milestone.getTitle());
        }

        // Log event
        eventRepository.save(Event.builder()
                .team(team)
                .user(submitter)
                .eventType("MILESTONE_SUBMITTED")
                .eventData(Map.of("milestoneId", milestoneId, "onTime", isOnTime))
                .build());

        // ── Observer Pattern ── Publish event; listeners handle notifications + audit
        eventPublisher.publishEvent(
                new MilestoneSubmittedEvent(this, milestone, submission, team, submitter, isOnTime)
        );

        // ── Builder Pattern ── Notify mentor via fluent builder
        mentorshipRepository.findByTeamIdAndStatus(team.getId(), Mentorship.MentorshipStatus.ACCEPTED)
                .ifPresent(m -> notificationService.send(
                        NotificationRequest.to(m.getFaculty().getId())
                                .message("📄 Team '" + team.getTeamName() + "' has submitted: " + milestone.getTitle())
                                .type(Notification.NotificationType.MILESTONE_REVIEWED)
                                .reference(milestoneId, "MILESTONE")
                                .build()
                ));

        return submission;
    }

    @Transactional
    public Evaluation evaluateMilestone(Long milestoneId, Long mentorId,
                                         Double marks, String feedback,
                                         Map<String, Object> feedbackData) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        Evaluation eval = evaluationRepository.findByMilestoneId(milestoneId)
                .orElse(Evaluation.builder().milestone(milestone).mentor(mentor).build());

        eval.setTotalMarks(marks);
        eval.setFeedback(feedback);
        eval.setFeedbackData(feedbackData);
        eval.setIsPublished(true);
        final Evaluation savedEval = evaluationRepository.save(eval);

        milestone.setStatus(Milestone.MilestoneStatus.APPROVED);
        milestoneRepository.save(milestone);

        // Log event
        Team team = milestone.getTeam();
        team.setLastActivityAt(LocalDateTime.now());
        teamRepository.save(team);

        eventRepository.save(Event.builder()
                .team(team)
                .user(mentor)
                .eventType("GRADE_GIVEN")
                .eventData(Map.of("milestoneId", milestoneId, "marks", marks))
                .build());

        // ── Builder Pattern ── Notify each team member via fluent builder
        team.getMembers().stream()
                .filter(m -> m.getInviteStatus() == TeamMember.InviteStatus.ACCEPTED)
                .forEach(m -> notificationService.send(
                        NotificationRequest.to(m.getUser().getId())
                                .message("✅ Your submission for '" + milestone.getTitle() + "' has been graded: " + marks + "/" + savedEval.getMaxMarks())
                                .type(Notification.NotificationType.GRADE_PUBLISHED)
                                .reference(milestoneId, "MILESTONE")
                                .build()
                ));

        return savedEval;
    }
}
