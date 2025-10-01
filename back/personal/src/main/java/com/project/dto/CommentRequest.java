package com.project.dto;

import lombok.Data;

@Data
public class CommentRequest {
    private String content;
    private Long parentId; // 대댓글의 경우 부모 댓글 ID
}