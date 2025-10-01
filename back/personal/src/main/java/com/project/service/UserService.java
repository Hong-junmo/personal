package com.project.service;

import com.project.dto.LoginRequest;
import com.project.dto.LoginResponse;
import com.project.dto.SignupRequest;
import com.project.dto.SignupResponse;
import com.project.entity.User;
import com.project.repository.UserRepository;
import com.project.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    public SignupResponse signup(SignupRequest request) {
        // 아이디 중복 체크
        if (userRepository.existsByUsername(request.getUsername())) {
            SignupResponse response = new SignupResponse();
            response.setSuccess(false);
            response.setMessage("이미 존재하는 아이디입니다.");
            response.setToken(null);
            return response;
        }
        
        // 닉네임 중복 체크
        if (userRepository.existsByNickname(request.getNickname())) {
            SignupResponse response = new SignupResponse();
            response.setSuccess(false);
            response.setMessage("이미 존재하는 닉네임입니다.");
            response.setToken(null);
            return response;
        }
        
        // 사용자 생성
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // 비밀번호 암호화
        user.setNickname(request.getNickname());
        
        System.out.println("사용자 저장 시도: " + user.getUsername());
        try {
            User savedUser = userRepository.save(user);
            System.out.println("사용자 저장 성공, ID: " + savedUser.getId());
            user = savedUser;
        } catch (Exception e) {
            System.out.println("사용자 저장 실패: " + e.getMessage());
            throw e;
        }
        
        // JWT 토큰 생성
        String token = jwtUtil.generateToken(user.getUsername());
        
        SignupResponse response = new SignupResponse();
        response.setSuccess(true);
        response.setMessage("회원가입이 완료되었습니다.");
        response.setToken(token);
        return response;
    }
    
    public LoginResponse login(LoginRequest request) {
        // 사용자 조회
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 비밀번호 확인
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }
        
        // 정지 상태 확인
        if (user.getIsSuspended() != null && user.getIsSuspended()) {
            // 영구 정지인 경우 (suspensionEndTime이 null)
            if (user.getSuspensionEndTime() == null) {
                String message = "🚫 계정이 영구 정지되었습니다.\n\n" +
                               "이 계정은 영구적으로 사용이 제한되었습니다.";
                
                if (user.getSuspensionReason() != null && !user.getSuspensionReason().trim().isEmpty()) {
                    message += "\n\n정지 사유:\n" + user.getSuspensionReason();
                }
                
                message += "\n\n문의사항이 있으시면 관리자에게 연락해 주세요.";
                
                throw new RuntimeException(message);
            }
            // 기간 정지인 경우
            else if (user.getSuspensionEndTime().isAfter(java.time.LocalDateTime.now())) {
                // 정지 시간 포맷팅
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH시 mm분");
                String formattedEndTime = user.getSuspensionEndTime().format(formatter);
                
                // 남은 시간 계산
                java.time.Duration duration = java.time.Duration.between(java.time.LocalDateTime.now(), user.getSuspensionEndTime());
                long remainingDays = duration.toDays();
                long remainingHours = duration.toHours() % 24;
                long remainingMinutes = duration.toMinutes() % 60;
                
                String remainingTime = "";
                if (remainingDays > 0) {
                    remainingTime = remainingDays + "일 " + remainingHours + "시간 " + remainingMinutes + "분";
                } else if (remainingHours > 0) {
                    remainingTime = remainingHours + "시간 " + remainingMinutes + "분";
                } else {
                    remainingTime = remainingMinutes + "분";
                }
                
                String message = "🚫 계정이 정지되었습니다.\n\n" +
                               "정지 해제 시간: " + formattedEndTime + "\n" +
                               "남은 시간: " + remainingTime;
                
                if (user.getSuspensionReason() != null && !user.getSuspensionReason().trim().isEmpty()) {
                    message += "\n\n정지 사유:\n" + user.getSuspensionReason();
                }
                
                message += "\n\n정지 해제 후 다시 로그인해 주세요.";
                
                throw new RuntimeException(message);
            } else {
                // 정지 시간이 지났으면 정지 해제
                user.setIsSuspended(false);
                user.setSuspensionEndTime(null);
                user.setSuspensionReason(null);
                userRepository.save(user);
            }
        }
        
        // JWT 토큰 생성
        String token = jwtUtil.generateToken(user.getUsername());
        
        return LoginResponse.builder()
            .success(true)
            .message("로그인 성공")
            .token(token)
            .username(user.getUsername())
            .nickname(user.getNickname())
            .build();
    }
    
    public String getUsernameFromToken(String token) {
        return jwtUtil.getUsernameFromToken(token);
    }
    
    public com.project.dto.UserProfileResponse getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        return com.project.dto.UserProfileResponse.builder()
            .username(user.getUsername())
            .nickname(user.getNickname())
            .build();
    }
    
    public void changeUsername(String currentUsername, com.project.dto.ChangeUsernameRequest request) {
        User user = userRepository.findByUsername(currentUsername)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 아이디 중복 체크
        if (userRepository.existsByUsername(request.getNewUsername())) {
            throw new RuntimeException("이미 존재하는 아이디입니다.");
        }
        
        user.setUsername(request.getNewUsername());
        userRepository.save(user);
    }
    
    public void updateProfile(String username, com.project.dto.UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 닉네임 중복 체크 (자신 제외)
        if (!user.getNickname().equals(request.getNickname()) && 
            userRepository.existsByNickname(request.getNickname())) {
            throw new RuntimeException("이미 존재하는 닉네임입니다.");
        }
        
        user.setNickname(request.getNickname());
        userRepository.save(user);
    }
    
    public void changePassword(String username, com.project.dto.ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    
    public void deleteAccount(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        userRepository.delete(user);
    }
    
    public void checkUserSuspensionStatus(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 정지 상태 확인
        if (user.getIsSuspended() != null && user.getIsSuspended()) {
            // 영구 정지인 경우 (suspensionEndTime이 null)
            if (user.getSuspensionEndTime() == null) {
                throw new RuntimeException("SUSPENDED:영구 정지된 계정입니다. 관리자에게 문의하세요.");
            }
            // 기간 정지인 경우
            else if (user.getSuspensionEndTime().isAfter(java.time.LocalDateTime.now())) {
                // 정지 시간 포맷팅
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH시 mm분");
                String formattedEndTime = user.getSuspensionEndTime().format(formatter);
                
                throw new RuntimeException("SUSPENDED:계정이 정지되었습니다. 정지 해제 시간: " + formattedEndTime);
            } else {
                // 정지 시간이 지났으면 정지 해제
                user.setIsSuspended(false);
                user.setSuspensionEndTime(null);
                user.setSuspensionReason(null);
                userRepository.save(user);
            }
        }
    }
}