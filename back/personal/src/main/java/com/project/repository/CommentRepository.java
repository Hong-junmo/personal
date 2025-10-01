package com.project.repository;

import com.project.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(Long postId);
    List<Comment> findByParentIdOrderByCreatedAtAsc(Long parentId);
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
    int countByPostId(Long postId);
}