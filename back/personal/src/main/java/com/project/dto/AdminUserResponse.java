package com.project.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String username;
    private String nickname;
    private String role;
    private Boolean isSuspended;
    private LocalDateTime suspensionEndTime;
    private String suspensionReason;
    private LocalDateTime createdAt;
}