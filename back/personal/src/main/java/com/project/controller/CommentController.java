package com.project.controller;

import com.project.dto.CommentRequest;
import com.project.dto.CommentResponse;
import com.project.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class CommentController {
    
    private final PostService postService;
    
    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentRequest request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = postService.getUsernameFromToken(token.replace("Bearer ", ""));
            CommentResponse comment = postService.updateComment(commentId, request.getContent(), username);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = postService.getUsernameFromToken(token.replace("Bearer ", ""));
            postService.deleteComment(commentId, username);
            return ResponseEntity.ok().body("{\"message\":\"댓글이 삭제되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}