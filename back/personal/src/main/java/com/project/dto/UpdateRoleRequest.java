package com.project.dto;

import lombok.Data;

@Data
public class UpdateRoleRequest {
    private Long userId;
    private String role; // USER, ADMIN
}