package com.project.controller;

import com.project.dto.PostCreateRequest;
import com.project.dto.PostResponse;
import com.project.dto.PostImageResponse;
import com.project.dto.PostLikeResponse;
import com.project.dto.CommentRequest;
import com.project.dto.CommentResponse;
import com.project.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class PostController {
    
    private final PostService postService;
    
    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPosts() {
        try {
            List<PostResponse> posts = postService.getAllPosts();
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            System.out.println("POST /api/posts 호출됨");
            System.out.println("Title: " + title);
            System.out.println("Content: " + content);
            System.out.println("Token: " + token);
            
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = postService.getUsernameFromToken(token.replace("Bearer ", ""));
            PostResponse post = postService.createPost(title, content, images, username);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPost(@PathVariable Long id) {
        try {
            PostResponse post = postService.getPost(id);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}/images")
    public ResponseEntity<List<PostImageResponse>> getPostImages(@PathVariable Long id) {
        try {
            List<PostImageResponse> images = postService.getPostImages(id);
            return ResponseEntity.ok(images);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = postService.getUsernameFromToken(token.replace("Bearer ", ""));
            PostResponse post = postService.updatePost(id, title, content, images, username);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = postService.getUsernameFromToken(token.replace("Bearer ", ""));
            postService.deletePost(id, username);
            return ResponseEntity.ok().body("{\"message\":\"게시글이 삭제되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @PostMapping("/{id}/like")
    public ResponseEntity<?> likePost(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = postService.getUsernameFromToken(token.replace("Bearer ", ""));
            PostLikeResponse response = postService.toggleLike(id, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @PostMapping("/{id}/dislike")
    public ResponseEntity<?> dislikePost(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = postService.getUsernameFromToken(token.replace("Bearer ", ""));
            PostLikeResponse response = postService.toggleDislike(id, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @GetMapping("/{id}/like-status")
    public ResponseEntity<?> getLikeStatus(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = postService.getUsernameFromToken(token.replace("Bearer ", ""));
            PostLikeResponse response = postService.getLikeStatus(id, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long id) {
        try {
            List<CommentResponse> comments = postService.getComments(id);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @PostMapping("/{id}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable Long id,
            @RequestBody CommentRequest request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = postService.getUsernameFromToken(token.replace("Bearer ", ""));
            CommentResponse comment = postService.createComment(id, request.getContent(), username);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}