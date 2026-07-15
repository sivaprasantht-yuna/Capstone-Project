package com.capstone.service;

import com.capstone.dto.auth.*;
import com.capstone.model.*;
import com.capstone.repository.*;
import com.capstone.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final FacultyProfileRepository facultyProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .department(request.getDepartment())
                .isVerified(true)  // simplified; add email verification in prod
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Create corresponding profile
        switch (user.getRole()) {
            case STUDENT -> {
                StudentProfile profile = StudentProfile.builder()
                        .user(user)
                        .yearOfStudy(request.getYearOfStudy())
                        .build();
                studentProfileRepository.save(profile);
            }
            case FACULTY -> {
                FacultyProfile profile = FacultyProfile.builder()
                        .user(user)
                        .designation(request.getDesignation())
                        .maxTeamCapacity(5)
                        .build();
                facultyProfileRepository.save(profile);
            }
            default -> { /* Admin / Industry — no extra profile */ }
        }

        String accessToken  = jwtUtils.generateAccessToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .department(user.getDepartment())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String accessToken  = jwtUtils.generateAccessToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .department(user.getDepartment())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtils.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid or expired refresh token");
        }
        String email  = jwtUtils.getEmailFromToken(refreshToken);
        String role   = jwtUtils.getRoleFromToken(refreshToken);
        Long   userId = jwtUtils.getUserIdFromToken(refreshToken);

        String newAccessToken = jwtUtils.generateAccessToken(email, role, userId);
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .userId(userId)
                .role(role)
                .email(email)
                .build();
    }
}
