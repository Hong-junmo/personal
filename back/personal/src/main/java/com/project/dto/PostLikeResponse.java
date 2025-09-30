package com.project.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostLikeResponse {
    private int likeCount;
    private int dislikeCount;
    private String userStatus; // "like", "dislike", null
}