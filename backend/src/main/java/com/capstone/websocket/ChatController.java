package com.capstone.websocket;

import com.capstone.model.Message;
import com.capstone.repository.MessageRepository;
import com.capstone.repository.TeamRepository;
import com.capstone.repository.UserRepository;
import com.capstone.repository.EventRepository;
import com.capstone.model.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessageRepository messageRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Client sends to: /app/chat/{teamId}
     * Subscribers receive from: /topic/team/{teamId}
     */
    @MessageMapping("/chat/{teamId}")
    @SendTo("/topic/team/{teamId}")
    public ChatMessagePayload handleTeamMessage(
            @DestinationVariable Long teamId,
            IncomingChatMessage incoming,
            Principal principal) {

        User sender = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        // Persist message
        Message msg = Message.builder()
                .team(team)
                .sender(sender)
                .content(incoming.getContent())
                .type(Message.MessageType.TEXT)
                .build();
        messageRepository.save(msg);

        // Update last activity
        team.setLastActivityAt(LocalDateTime.now());
        teamRepository.save(team);

        // Log event
        eventRepository.save(Event.builder()
                .team(team)
                .user(sender)
                .eventType("CHAT_MESSAGE")
                .eventData(Map.of("messageLength", incoming.getContent().length()))
                .build());

        return new ChatMessagePayload(
                sender.getId(), sender.getName(), sender.getAvatarUrl(),
                incoming.getContent(), msg.getTimestamp().toString()
        );
    }

    @MessageMapping("/chat/{teamId}/history")
    public void getChatHistory(@DestinationVariable Long teamId, Principal principal) {
        List<Message> history = messageRepository.findByTeamIdOrderByTimestampAsc(teamId);
        messagingTemplate.convertAndSendToUser(
                principal.getName(), "/queue/chat-history", history);
    }

    @Data
    public static class IncomingChatMessage {
        private String content;
    }

    @Data
    public static class ChatMessagePayload {
        private final Long senderId;
        private final String senderName;
        private final String senderAvatar;
        private final String content;
        private final String timestamp;
    }
}
