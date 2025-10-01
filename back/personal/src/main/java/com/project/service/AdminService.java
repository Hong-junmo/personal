package com.project.service;

import com.project.dto.AdminUserResponse;
import com.project.entity.Post;
import com.project.entity.PostImage;
import com.project.entity.PostLike;
import com.project.entity.User;
import com.project.entity.Comment;
import com.project.repository.PostRepository;
import com.project.repository.PostImageRepository;
import com.project.repository.PostLikeRepository;
import com.project.repository.UserRepository;
import com.project.repository.CommentRepository;
import com.project.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {
    
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final JwtUtil jwtUtil;
    
    public String getUsernameFromToken(String token) {
        return jwtUtil.getUsernameFromToken(token);
    }
    
    private void checkAdminPermission(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (!"ADMIN".equals(user.getRole()) && !"OPERATOR".equals(user.getRole())) {
            throw new RuntimeException("관리자 권한이 필요합니다.");
        }
    }
    
    private void checkOperatorPermission(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (!"OPERATOR".equals(user.getRole())) {
            throw new RuntimeException("운영자 권한이 필요합니다.");
        }
    }
    
    private boolean canManageUser(String adminUsername, User targetUser) {
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 운영자는 모든 사용자 관리 가능
        if ("OPERATOR".equals(admin.getRole())) {
            return true;
        }
        
        // 관리자는 운영자를 관리할 수 없음
        if ("ADMIN".equals(admin.getRole()) && "OPERATOR".equals(targetUser.getRole())) {
            return false;
        }
        
        // 관리자는 일반 사용자와 다른 관리자 관리 가능
        return "ADMIN".equals(admin.getRole());
    }
    
    public List<AdminUserResponse> getAllUsers(String adminUsername) {
        checkAdminPermission(adminUsername);
        
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::convertToAdminUserResponse)
                .collect(Collectors.toList());
    }
    
    public void suspendUser(Long userId, Integer suspensionMinutes, String reason, String adminUsername) {
        checkAdminPermission(adminUsername);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (!canManageUser(adminUsername, user)) {
            throw new RuntimeException("해당 사용자를 관리할 권한이 없습니다.");
        }
        
        user.setIsSuspended(true);
        
        // 영구 정지인 경우 (suspensionMinutes가 null이거나 -1인 경우)
        if (suspensionMinutes == null || suspensionMinutes == -1) {
            user.setSuspensionEndTime(null); // null이면 영구 정지
        } else {
            user.setSuspensionEndTime(LocalDateTime.now().plusMinutes(suspensionMinutes));
        }
        
        user.setSuspensionReason(reason);
        
        userRepository.save(user);
    }
    
    public void updateUserRole(Long userId, String role, String adminUsername) {
        checkAdminPermission(adminUsername);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (!canManageUser(adminUsername, user)) {
            throw new RuntimeException("해당 사용자를 관리할 권한이 없습니다.");
        }
        
        if (!role.equals("USER") && !role.equals("ADMIN") && !role.equals("OPERATOR")) {
            throw new RuntimeException("유효하지 않은 역할입니다.");
        }
        
        // 관리자는 운영자 역할을 부여할 수 없음
        User admin = userRepository.findByUsername(adminUsername).get();
        if ("ADMIN".equals(admin.getRole()) && "OPERATOR".equals(role)) {
            throw new RuntimeException("관리자는 운영자 역할을 부여할 수 없습니다.");
        }
        
        user.setRole(role);
        userRepository.save(user);
    }
    
    public void deleteUser(Long userId, String adminUsername) {
        checkAdminPermission(adminUsername);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        User admin = userRepository.findByUsername(adminUsername).get();
        if (user.getId().equals(admin.getId())) {
            throw new RuntimeException("자기 자신은 삭제할 수 없습니다.");
        }
        
        if (!canManageUser(adminUsername, user)) {
            throw new RuntimeException("해당 사용자를 관리할 권한이 없습니다.");
        }
        
        userRepository.delete(user);
    }
    
    public void deletePostAsAdmin(Long postId, String adminUsername) {
        checkAdminPermission(adminUsername);
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        // 관련 이미지 파일 및 DB 데이터 삭제
        deletePostImages(postId);
        
        // 관련 댓글들 삭제
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        commentRepository.deleteAll(comments);
        
        // 관련 좋아요/비추천 삭제
        List<PostLike> likes = postLikeRepository.findByPostId(postId);
        postLikeRepository.deleteAll(likes);
        
        // 게시글 삭제
        postRepository.delete(post);
    }
    
    public boolean isAdmin(String username) {
        try {
            User user = userRepository.findByUsername(username)
                    .orElse(null);
            return user != null && ("ADMIN".equals(user.getRole()) || "OPERATOR".equals(user.getRole()));
        } catch (Exception e) {
            return false;
        }
    }
    
    public String getUserRole(String username) {
        try {
            User user = userRepository.findByUsername(username)
                    .orElse(null);
            return user != null ? user.getRole() : "USER";
        } catch (Exception e) {
            return "USER";
        }
    }
    
    public void suspendPostAuthor(Long postId, Integer suspensionMinutes, String reason, String adminUsername) {
        checkAdminPermission(adminUsername);
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        User author = userRepository.findById(post.getAuthorId())
                .orElseThrow(() -> new RuntimeException("게시글 작성자를 찾을 수 없습니다."));
        
        if (!canManageUser(adminUsername, author)) {
            throw new RuntimeException("해당 사용자를 관리할 권한이 없습니다.");
        }
        
        author.setIsSuspended(true);
        
        // 영구 정지인 경우 (suspensionMinutes가 null이거나 -1인 경우)
        if (suspensionMinutes == null || suspensionMinutes == -1) {
            author.setSuspensionEndTime(null); // null이면 영구 정지
        } else {
            author.setSuspensionEndTime(LocalDateTime.now().plusMinutes(suspensionMinutes));
        }
        
        author.setSuspensionReason(reason);
        
        userRepository.save(author);
    }
    
    public void suspendCommentAuthor(Long commentId, Integer suspensionMinutes, String reason, String adminUsername) {
        checkAdminPermission(adminUsername);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        User author = userRepository.findById(comment.getUserId())
                .orElseThrow(() -> new RuntimeException("댓글 작성자를 찾을 수 없습니다."));
        
        if (!canManageUser(adminUsername, author)) {
            throw new RuntimeException("해당 사용자를 관리할 권한이 없습니다.");
        }
        
        author.setIsSuspended(true);
        
        // 영구 정지인 경우 (suspensionMinutes가 null이거나 -1인 경우)
        if (suspensionMinutes == null || suspensionMinutes == -1) {
            author.setSuspensionEndTime(null); // null이면 영구 정지
        } else {
            author.setSuspensionEndTime(LocalDateTime.now().plusMinutes(suspensionMinutes));
        }
        
        author.setSuspensionReason(reason);
        
        userRepository.save(author);
    }
    
    public void deleteCommentAsAdmin(Long commentId, String adminUsername) {
        checkAdminPermission(adminUsername);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        // 대댓글들도 함께 삭제
        List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(commentId);
        commentRepository.deleteAll(replies);
        
        commentRepository.delete(comment);
    }
    
    public void unsuspendUser(Long userId, String adminUsername) {
        checkAdminPermission(adminUsername);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (!canManageUser(adminUsername, user)) {
            throw new RuntimeException("해당 사용자를 관리할 권한이 없습니다.");
        }
        
        user.setIsSuspended(false);
        user.setSuspensionEndTime(null);
        user.setSuspensionReason(null);
        
        userRepository.save(user);
    }
    
    private void deletePostImages(Long postId) {
        // DB에서 해당 게시글의 이미지 정보 조회
        List<PostImage> images = postImageRepository.findByPostIdOrderByImageOrder(postId);
        
        // 실제 파일 삭제
        for (PostImage image : images) {
            try {
                Path filePath = Paths.get(image.getFilePath());
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    System.out.println("관리자 권한으로 이미지 파일 삭제 완료: " + image.getStoredFilename());
                } else {
                    System.out.println("이미지 파일이 존재하지 않음: " + image.getStoredFilename());
                }
            } catch (IOException e) {
                System.err.println("이미지 파일 삭제 실패: " + image.getStoredFilename() + " - " + e.getMessage());
                // 파일 삭제 실패해도 DB 데이터는 삭제하도록 계속 진행
            }
        }
        
        // DB에서 이미지 정보 삭제
        postImageRepository.deleteAll(images);
        System.out.println("관리자 권한으로 게시글 " + postId + "의 이미지 " + images.size() + "개 삭제 완료");
    }
    
    private AdminUserResponse convertToAdminUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .role(user.getRole())
                .isSuspended(user.getIsSuspended())
                .suspensionEndTime(user.getSuspensionEndTime())
                .suspensionReason(user.getSuspensionReason())
                .createdAt(user.getCreatedAt())
                .build();
    }
}