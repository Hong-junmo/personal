package com.project.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostImageResponse {
    private Long id;
    private String originalFilename;
    private String storedFilename;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private Integer imageOrder;
}