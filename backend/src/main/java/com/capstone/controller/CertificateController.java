package com.capstone.controller;

import com.capstone.model.*;
import com.capstone.repository.*;
import com.capstone.service.CertificateService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
@Tag(name = "Certificates", description = "PDF certificate generation and retrieval")
public class CertificateController {

    private final CertificateService certificateService;
    private final CertificateRepository certificateRepository;

    @PostMapping("/generate/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<Certificate> generate(@PathVariable Long teamId) throws Exception {
        return ResponseEntity.ok(certificateService.generateAndIssueCertificate(teamId));
    }

    @GetMapping("/team/{teamId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Certificate> getCertificate(@PathVariable Long teamId) {
        return certificateRepository.findByTeamId(teamId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/verify/{certNumber}")
    public ResponseEntity<Certificate> verify(@PathVariable String certNumber) {
        return certificateRepository.findByCertificateNumber(certNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
