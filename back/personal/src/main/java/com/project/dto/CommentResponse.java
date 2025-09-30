package com.project.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private Long postId;
    private String authorNickname;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}