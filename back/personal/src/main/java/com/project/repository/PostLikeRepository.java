package com.project.repository;

import com.project.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    
    Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);
    
    int countByPostIdAndLikeType(Long postId, String likeType);
    
    void deleteByPostIdAndUserId(Long postId, Long userId);
}