package com.project.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(unique = true, nullable = false)
    private String nickname;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "role", nullable = false)
    private String role = "USER"; // USER, ADMIN, OPERATOR
    
    @Column(name = "is_suspended")
    private Boolean isSuspended = false;
    
    @Column(name = "suspension_end_time")
    private LocalDateTime suspensionEndTime;
    
    @Column(name = "suspension_reason")
    private String suspensionReason;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (role == null) {
            role = "USER";
        }
        if (isSuspended == null) {
            isSuspended = false;
        }
    }
}