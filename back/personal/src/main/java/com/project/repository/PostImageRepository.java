package com.project.repository;

import com.project.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostImageRepository extends JpaRepository<PostImage, Long> {
    
    List<PostImage> findByPostIdOrderByImageOrder(Long postId);
    
    void deleteByPostId(Long postId);
}