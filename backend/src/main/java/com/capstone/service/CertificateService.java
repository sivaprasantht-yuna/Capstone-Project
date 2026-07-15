package com.capstone.service;

import com.capstone.model.*;
import com.capstone.repository.*;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MentorshipRepository mentorshipRepository;
    private final CloudinaryService cloudinaryService;
    private final EventRepository eventRepository;
    private final NotificationService notificationService;

    @Transactional
    public Certificate generateAndIssueCertificate(Long teamId) throws Exception {
        // Check if already issued
        if (certificateRepository.findByTeamId(teamId).isPresent()) {
            return certificateRepository.findByTeamId(teamId).get();
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        List<TeamMember> members = teamMemberRepository
                .findByTeamIdAndInviteStatus(teamId, TeamMember.InviteStatus.ACCEPTED);

        Mentorship mentorship = mentorshipRepository
                .findByTeamIdAndStatus(teamId, Mentorship.MentorshipStatus.ACCEPTED)
                .orElse(null);

        String mentorName = mentorship != null ? mentorship.getFaculty().getName() : "N/A";
        String certNumber = "CAPSTONE-" + java.time.Year.now().getValue() + "-" +
                            String.format("%04d", teamId);

        byte[] pdfBytes = buildPdf(team, members, mentorName, certNumber);

        // Upload to Cloudinary
        String url = cloudinaryService.uploadPdf(pdfBytes, "certificate_team_" + teamId);

        Certificate certificate = Certificate.builder()
                .team(team)
                .pdfUrl(url)
                .certificateNumber(certNumber)
                .build();
        certificate = certificateRepository.save(certificate);

        // Update team status
        team.setStatus(Team.TeamStatus.COMPLETED);
        teamRepository.save(team);

        // Notify all members
        for (TeamMember m : members) {
            notificationService.sendNotification(
                    m.getUser().getId(),
                    "🎓 Your completion certificate is ready! Certificate No: " + certNumber,
                    Notification.NotificationType.CERTIFICATE_READY,
                    certificate.getId(), "CERTIFICATE"
            );
        }

        // Log event
        eventRepository.save(Event.builder()
                .team(team)
                .eventType("CERT_GENERATED")
                .eventData(Map.of("certNumber", certNumber, "teamId", teamId))
                .build());

        return certificate;
    }

    private byte[] buildPdf(Team team, List<TeamMember> members,
                             String mentorName, String certNumber) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf  = new PdfDocument(writer);
        Document doc     = new Document(pdf, PageSize.A4.rotate()); // Landscape

        // Background color
        doc.setBackgroundColor(new DeviceRgb(15, 23, 42));

        var boldFont   = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        var normalFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        var accent     = new DeviceRgb(99, 102, 241); // indigo
        var gold       = new DeviceRgb(234, 179, 8);  // yellow-500
        var white      = ColorConstants.WHITE;

        // Title
        doc.add(new Paragraph("CERTIFICATE OF COMPLETION")
                .setFont(boldFont).setFontSize(32).setFontColor(gold)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(30));

        doc.add(new Paragraph("Capstone Project Collaboration Ecosystem")
                .setFont(normalFont).setFontSize(14).setFontColor(white)
                .setTextAlignment(TextAlignment.CENTER));

        doc.add(new Paragraph("\nThis is to certify that the following team has successfully completed their")
                .setFont(normalFont).setFontSize(12).setFontColor(white)
                .setTextAlignment(TextAlignment.CENTER));

        doc.add(new Paragraph("capstone project under the supervision of their faculty mentor.")
                .setFont(normalFont).setFontSize(12).setFontColor(white)
                .setTextAlignment(TextAlignment.CENTER).setMarginBottom(20));

        // Team name
        doc.add(new Paragraph("Team: " + team.getTeamName())
                .setFont(boldFont).setFontSize(22).setFontColor(accent)
                .setTextAlignment(TextAlignment.CENTER));

        // Project title
        doc.add(new Paragraph("Project: " + team.getProject().getTitle())
                .setFont(normalFont).setFontSize(16).setFontColor(white)
                .setTextAlignment(TextAlignment.CENTER).setMarginBottom(15));

        // Members
        doc.add(new Paragraph("Team Members:")
                .setFont(boldFont).setFontSize(14).setFontColor(gold)
                .setTextAlignment(TextAlignment.CENTER));

        for (TeamMember m : members) {
            doc.add(new Paragraph(m.getUser().getName() + " (" + m.getUser().getDepartment() + ")")
                    .setFont(normalFont).setFontSize(12).setFontColor(white)
                    .setTextAlignment(TextAlignment.CENTER));
        }

        // Mentor
        doc.add(new Paragraph("\nFaculty Mentor: " + mentorName)
                .setFont(boldFont).setFontSize(13).setFontColor(accent)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(10));

        // Date & cert number
        String date = java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"));
        doc.add(new Paragraph("Date of Completion: " + date)
                .setFont(normalFont).setFontSize(11).setFontColor(white)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(20));

        doc.add(new Paragraph("Certificate No: " + certNumber)
                .setFont(normalFont).setFontSize(10).setFontColor(new DeviceRgb(148, 163, 184))
                .setTextAlignment(TextAlignment.CENTER));

        doc.close();
        return baos.toByteArray();
    }
}
