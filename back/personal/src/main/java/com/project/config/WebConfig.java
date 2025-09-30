package com.project.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 이미지 업로드 경로 설정
        registry.addResourceHandler("/uploads/images/**")
                .addResourceLocations("file:uploads/images/")
                .setCachePeriod(0);
    }
}