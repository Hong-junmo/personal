package com.project.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PostResponse {
    private Long id;
    private String title;
    private String content;
    private String author;
    private Integer viewCount;
    private Boolean hasImages;
    private Integer commentCount;
    private LocalDateTime createdAt;
}