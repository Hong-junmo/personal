package com.project.controller;

import com.project.dto.AdminUserResponse;
import com.project.dto.SuspendUserRequest;
import com.project.dto.UpdateRoleRequest;
import com.project.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class AdminController {
    
    private final AdminService adminService;
    
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            List<AdminUserResponse> users = adminService.getAllUsers(username);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @PostMapping("/users/suspend")
    public ResponseEntity<?> suspendUser(
            @RequestBody SuspendUserRequest request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String adminUsername = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            adminService.suspendUser(request.getUserId(), request.getSuspensionMinutes(), request.getReason(), adminUsername);
            
            String message = (request.getSuspensionMinutes() == null || request.getSuspensionMinutes() == -1) 
                ? "사용자가 영구 정지되었습니다." 
                : "사용자가 정지되었습니다.";
            
            return ResponseEntity.ok().body("{\"message\":\"" + message + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @PostMapping("/users/{userId}/unsuspend")
    public ResponseEntity<?> unsuspendUser(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String adminUsername = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            adminService.unsuspendUser(userId, adminUsername);
            return ResponseEntity.ok().body("{\"message\":\"사용자 정지가 해제되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @PostMapping("/users/role")
    public ResponseEntity<?> updateUserRole(
            @RequestBody UpdateRoleRequest request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String adminUsername = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            adminService.updateUserRole(request.getUserId(), request.getRole(), adminUsername);
            return ResponseEntity.ok().body("{\"message\":\"사용자 역할이 변경되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String adminUsername = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            adminService.deleteUser(userId, adminUsername);
            return ResponseEntity.ok().body("{\"message\":\"사용자가 삭제되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long postId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String adminUsername = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            adminService.deletePostAsAdmin(postId, adminUsername);
            return ResponseEntity.ok().body("{\"message\":\"게시글이 삭제되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @GetMapping("/check-role")
    public ResponseEntity<?> checkAdminRole(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String username = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            boolean isAdmin = adminService.isAdmin(username);
            String userRole = adminService.getUserRole(username);
            return ResponseEntity.ok().body("{\"isAdmin\":" + isAdmin + ",\"role\":\"" + userRole + "\"}");
        } catch (Exception e) {
            return ResponseEntity.ok().body("{\"isAdmin\":false,\"role\":\"USER\"}");
        }
    }
    
    @PostMapping("/posts/{postId}/suspend-author")
    public ResponseEntity<?> suspendPostAuthor(
            @PathVariable Long postId,
            @RequestBody SuspendUserRequest request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String adminUsername = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            adminService.suspendPostAuthor(postId, request.getSuspensionMinutes(), request.getReason(), adminUsername);
            return ResponseEntity.ok().body("{\"message\":\"게시글 작성자가 정지되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @PostMapping("/comments/{commentId}/suspend-author")
    public ResponseEntity<?> suspendCommentAuthor(
            @PathVariable Long commentId,
            @RequestBody SuspendUserRequest request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String adminUsername = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            adminService.suspendCommentAuthor(commentId, request.getSuspensionMinutes(), request.getReason(), adminUsername);
            return ResponseEntity.ok().body("{\"message\":\"댓글 작성자가 정지되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("{\"message\":\"인증이 필요합니다.\"}");
            }
            
            String adminUsername = adminService.getUsernameFromToken(token.replace("Bearer ", ""));
            adminService.deleteCommentAsAdmin(commentId, adminUsername);
            return ResponseEntity.ok().body("{\"message\":\"댓글이 삭제되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}