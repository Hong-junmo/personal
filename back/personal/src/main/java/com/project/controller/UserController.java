package com.project.controller;

import com.project.dto.LoginRequest;
import com.project.dto.LoginResponse;
import com.project.dto.SignupRequest;
import com.project.dto.SignupResponse;
import com.project.dto.UpdateProfileRequest;
import com.project.dto.ChangePasswordRequest;
import com.project.dto.ChangeUsernameRequest;
import com.project.dto.UserProfileResponse;
import com.project.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000") // React 앱과 연결
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(@RequestBody SignupRequest request) {
        try {
            System.out.println("회원가입 요청: " + request.getUsername() + ", " + request.getNickname());
            SignupResponse response = userService.signup(request);
            System.out.println("회원가입 응답: " + response.isSuccess() + ", " + response.getMessage());
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            System.out.println("회원가입 오류: " + e.getMessage());
            e.printStackTrace();
            SignupResponse errorResponse = new SignupResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("회원가입 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // 정지 메시지인 경우 그대로 전달, 그 외에는 일반 로그인 실패 메시지
            String message = e.getMessage();
            if (message != null && (message.contains("🚫 계정이") || 
                                   message.contains("영구적으로 사용이 제한") ||
                                   message.contains("정지 해제 시간:") ||
                                   message.contains("영구 정지") ||
                                   message.contains("남은 시간:"))) {
                // 정지 메시지는 그대로 전달
                return ResponseEntity.badRequest()
                    .body(LoginResponse.builder()
                        .success(false)
                        .message(message)
                        .build());
            } else {
                // 일반 로그인 실패
                return ResponseEntity.badRequest()
                    .body(LoginResponse.builder()
                        .success(false)
                        .message("로그인에 실패했습니다: " + message)
                        .build());
            }
        }
    }
    
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(@RequestHeader("Authorization") String token) {
        try {
            String username = userService.getUsernameFromToken(token.replace("Bearer ", ""));
            // 사용자 정지 상태 확인
            userService.checkUserSuspensionStatus(username);
            UserProfileResponse profile = userService.getUserProfile(username);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            if (e.getMessage().startsWith("SUSPENDED:")) {
                return ResponseEntity.status(401)
                    .body(UserProfileResponse.builder()
                        .message(e.getMessage().replace("SUSPENDED:", ""))
                        .build());
            }
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/change-username")
    public ResponseEntity<?> changeUsername(@RequestBody ChangeUsernameRequest request,
                                          @RequestHeader("Authorization") String token) {
        try {
            String currentUsername = userService.getUsernameFromToken(token.replace("Bearer ", ""));
            // 사용자 정지 상태 확인
            userService.checkUserSuspensionStatus(currentUsername);
            userService.changeUsername(currentUsername, request);
            return ResponseEntity.ok().body("{\"message\":\"아이디가 변경되었습니다.\"}");
        } catch (Exception e) {
            if (e.getMessage().startsWith("SUSPENDED:")) {
                return ResponseEntity.status(401).body("{\"message\":\"" + e.getMessage().replace("SUSPENDED:", "") + "\"}");
            }
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request, 
                                         @RequestHeader("Authorization") String token) {
        try {
            String username = userService.getUsernameFromToken(token.replace("Bearer ", ""));
            // 사용자 정지 상태 확인
            userService.checkUserSuspensionStatus(username);
            userService.updateProfile(username, request);
            return ResponseEntity.ok().body("{\"message\":\"프로필이 업데이트되었습니다.\"}");
        } catch (Exception e) {
            if (e.getMessage().startsWith("SUSPENDED:")) {
                return ResponseEntity.status(401).body("{\"message\":\"" + e.getMessage().replace("SUSPENDED:", "") + "\"}");
            }
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request,
                                          @RequestHeader("Authorization") String token) {
        try {
            String username = userService.getUsernameFromToken(token.replace("Bearer ", ""));
            // 사용자 정지 상태 확인
            userService.checkUserSuspensionStatus(username);
            userService.changePassword(username, request);
            return ResponseEntity.ok().body("{\"message\":\"비밀번호가 변경되었습니다.\"}");
        } catch (Exception e) {
            if (e.getMessage().startsWith("SUSPENDED:")) {
                return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage().replace("SUSPENDED:", "") + "\"}");
            }
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(@RequestHeader("Authorization") String token) {
        try {
            String username = userService.getUsernameFromToken(token.replace("Bearer ", ""));
            userService.deleteAccount(username);
            return ResponseEntity.ok().body("{\"message\":\"회원탈퇴가 완료되었습니다.\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}