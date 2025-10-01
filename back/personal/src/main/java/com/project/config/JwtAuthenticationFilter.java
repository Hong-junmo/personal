package com.project.config;

import com.project.entity.User;
import com.project.repository.UserRepository;
import com.project.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // JWT 검증 제외 경로들
        String requestPath = request.getRequestURI();
        String method = request.getMethod();
        
        System.out.println("JWT Filter - Path: " + requestPath + ", Method: " + method);
        
        if (requestPath.startsWith("/uploads/images/") || 
            requestPath.equals("/api/users/signup") || 
            requestPath.equals("/api/users/login") ||
            "OPTIONS".equals(method)) {
            System.out.println("JWT Filter - 제외된 경로, 필터 건너뛰기");
            filterChain.doFilter(request, response);
            return;
        }
        
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                username = jwtUtil.getUsernameFromToken(token);
            } catch (Exception e) {
                logger.error("JWT Token validation error: " + e.getMessage());
            }
        }
        
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.validateToken(token)) {
                try {
                    // 사용자 정지 상태 확인
                    String suspensionMessage = checkUserSuspensionStatus(username);
                    if (suspensionMessage != null) {
                        // 정지된 사용자인 경우 401 Unauthorized 응답
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\":\"" + suspensionMessage + "\"}");
                        return;
                    }
                    
                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(username, null, new ArrayList<>());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } catch (Exception e) {
                    logger.error("User suspension check error: " + e.getMessage());
                }
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String checkUserSuspensionStatus(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return "사용자를 찾을 수 없습니다.";
        }
        
        User user = userOpt.get();
        
        // 정지 상태 확인
        if (user.getIsSuspended() != null && user.getIsSuspended()) {
            // 영구 정지인 경우 (suspensionEndTime이 null)
            if (user.getSuspensionEndTime() == null) {
                return "영구 정지된 계정입니다. 관리자에게 문의하세요.";
            }
            // 기간 정지인 경우
            else if (user.getSuspensionEndTime().isAfter(LocalDateTime.now())) {
                // 정지 시간 포맷팅
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH시 mm분");
                String formattedEndTime = user.getSuspensionEndTime().format(formatter);
                
                return "계정이 정지되었습니다. 정지 해제 시간: " + formattedEndTime;
            } else {
                // 정지 시간이 지났으면 정지 해제
                user.setIsSuspended(false);
                user.setSuspensionEndTime(null);
                user.setSuspensionReason(null);
                userRepository.save(user);
            }
        }
        
        return null; // 정지되지 않음
    }
}