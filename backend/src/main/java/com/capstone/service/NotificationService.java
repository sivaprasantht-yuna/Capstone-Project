package com.capstone.service;

import com.capstone.model.Notification;
import com.capstone.model.User;
import com.capstone.notification.NotificationRequest;
import com.capstone.repository.NotificationRepository;
import com.capstone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Creates a notification record and pushes it in real-time via STOMP
     * to the user's personal queue: /user/{userId}/queue/notifications
     */
    @Transactional
    public Notification sendNotification(Long userId,
                                          String message,
                                          Notification.NotificationType type,
                                          Long referenceId,
                                          String referenceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .notificationType(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        // Push real-time via WebSocket
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    notification
            );
        } catch (Exception e) {
            log.warn("Could not push real-time notification to user {}: {}", userId, e.getMessage());
        }

        return notification;
    }

    /**
     * ── Builder Pattern integration ──────────────────────────────────────────
     * Accepts a {@link NotificationRequest} built via the fluent Builder API.
     * This is the preferred method for new call-sites.
     *
     * Usage:
     *   notificationService.send(
     *       NotificationRequest.to(userId)
     *           .message("You've been invited!")
     *           .type(NotificationType.TEAM_INVITE)
     *           .reference(teamId, "TEAM")
     *           .build()
     *   );
     */
    @Transactional
    public Notification send(NotificationRequest request) {
        return sendNotification(
                request.getRecipientId(),
                request.getMessage(),
                request.getType(),
                request.getReferenceId(),
                request.getReferenceType()
        );
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadForUser(userId);
    }

    @Transactional
    public void markRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }
}
