package com.capstone.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private Long   userId;
    private String name;
    private String email;
    private String role;
    private String department;
}
