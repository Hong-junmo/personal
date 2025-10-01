package com.project.dto;

import lombok.Data;

@Data
public class SuspendUserRequest {
    private Long userId;
    private Integer suspensionMinutes; // 정지 시간 (분 단위)
    private String reason; // 정지 사유
}