package com.project.service;

import com.project.dto.PostResponse;
import com.project.dto.PostImageResponse;
import com.project.dto.PostLikeResponse;
import com.project.dto.CommentResponse;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {
    
    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    
    public String getUsernameFromToken(String token) {
        return jwtUtil.getUsernameFromToken(token);
    }
    
    public List<PostResponse> getAllPosts() {
        List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
        return posts.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public PostResponse createPost(String title, String content, List<MultipartFile> images, String username) {
        // 사용자 정지 상태 확인
        userService.checkUserSuspensionStatus(username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setAuthorId(user.getId());
        post.setAuthorNickname(user.getNickname());
        post.setViewCount(0);
        post.setHasImages(images != null && !images.isEmpty());
        post.setImageCount(images != null ? images.size() : 0);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        
        Post savedPost = postRepository.save(post);
        
        // 이미지 파일 저장 로직
        if (images != null && !images.isEmpty()) {
            savePostImages(savedPost.getId(), images);
        }
        
        return convertToResponse(savedPost);
    }
    
    public PostResponse getPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        return convertToResponse(post);
    }
    
    public void increaseViewCount(Long id, String username) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        // 작성자 본인이 조회하는 경우 조회수 증가하지 않음
        if (username != null) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && post.getAuthorId().equals(user.getId())) {
                return; // 본인 게시글은 조회수 증가하지 않음
            }
        }
        
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
    }
    
    public List<PostImageResponse> getPostImages(Long postId) {
        List<PostImage> images = postImageRepository.findByPostIdOrderByImageOrder(postId);
        return images.stream()
                .map(image -> PostImageResponse.builder()
                        .id(image.getId())
                        .originalFilename(image.getOriginalFilename())
                        .storedFilename(image.getStoredFilename())
                        .filePath(image.getFilePath())
                        .fileSize(image.getFileSize())
                        .mimeType(image.getMimeType())
                        .imageOrder(image.getImageOrder())
                        .build())
                .collect(Collectors.toList());
    }
    
    private void savePostImages(Long postId, List<MultipartFile> images) {
        String uploadDir = System.getProperty("user.dir") + "/uploads/images/";
        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.exists()) {
            uploadDirFile.mkdirs();
        }
        
        for (int i = 0; i < images.size(); i++) {
            MultipartFile image = images.get(i);
            try {
                String originalFilename = image.getOriginalFilename();
                String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                String storedFilename = UUID.randomUUID().toString() + fileExtension;
                String filePath = uploadDir + storedFilename;
                
                // 파일 저장
                Path path = Paths.get(filePath);
                Files.write(path, image.getBytes());
                
                // DB에 이미지 정보 저장
                PostImage postImage = new PostImage();
                postImage.setPostId(postId);
                postImage.setOriginalFilename(originalFilename);
                postImage.setStoredFilename(storedFilename);
                postImage.setFilePath(filePath);
                postImage.setFileSize(image.getSize());
                postImage.setMimeType(image.getContentType());
                postImage.setImageOrder(i);
                
                postImageRepository.save(postImage);
                
            } catch (IOException e) {
                throw new RuntimeException("이미지 저장 중 오류가 발생했습니다: " + e.getMessage());
            }
        }
    }
    
    public PostResponse updatePost(Long id, String title, String content, List<MultipartFile> images, String username) {
        // 사용자 정지 상태 확인
        userService.checkUserSuspensionStatus(username);
        
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!post.getAuthorId().equals(user.getId())) {
            throw new RuntimeException("게시글을 수정할 권한이 없습니다.");
        }
        
        post.setTitle(title);
        post.setContent(content);
        post.setUpdatedAt(LocalDateTime.now());
        
        if (images != null) {
            post.setHasImages(!images.isEmpty());
            post.setImageCount(images.size());
        }
        
        Post updatedPost = postRepository.save(post);
        
        // TODO: 이미지 파일 업데이트 로직 구현
        
        return convertToResponse(updatedPost);
    }
    
    public void deletePost(Long id, String username) {
        // 사용자 정지 상태 확인
        userService.checkUserSuspensionStatus(username);
        
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!post.getAuthorId().equals(user.getId())) {
            throw new RuntimeException("게시글을 삭제할 권한이 없습니다.");
        }
        
        // TODO: 관련 이미지 파일도 삭제
        
        postRepository.delete(post);
    }
    
    public PostLikeResponse toggleLike(Long postId, String username) {
        // 사용자 정지 상태 확인
        userService.checkUserSuspensionStatus(username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        Optional<PostLike> existingLike = postLikeRepository.findByPostIdAndUserId(postId, user.getId());
        
        String userStatus = null;
        
        if (existingLike.isPresent()) {
            PostLike like = existingLike.get();
            if ("like".equals(like.getLikeType())) {
                // 이미 좋아요를 눌렀다면 취소
                postLikeRepository.delete(like);
                userStatus = null;
            } else {
                // 비추천을 좋아요로 변경
                like.setLikeType("like");
                postLikeRepository.save(like);
                userStatus = "like";
            }
        } else {
            // 새로운 좋아요 추가
            PostLike newLike = new PostLike();
            newLike.setPostId(postId);
            newLike.setUserId(user.getId());
            newLike.setLikeType("like");
            postLikeRepository.save(newLike);
            userStatus = "like";
        }
        
        int likeCount = postLikeRepository.countByPostIdAndLikeType(postId, "like");
        int dislikeCount = postLikeRepository.countByPostIdAndLikeType(postId, "dislike");
        
        return PostLikeResponse.builder()
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .userStatus(userStatus)
                .build();
    }
    
    public PostLikeResponse toggleDislike(Long postId, String username) {
        // 사용자 정지 상태 확인
        userService.checkUserSuspensionStatus(username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        Optional<PostLike> existingLike = postLikeRepository.findByPostIdAndUserId(postId, user.getId());
        
        String userStatus = null;
        
        if (existingLike.isPresent()) {
            PostLike like = existingLike.get();
            if ("dislike".equals(like.getLikeType())) {
                // 이미 비추천을 눌렀다면 취소
                postLikeRepository.delete(like);
                userStatus = null;
            } else {
                // 좋아요를 비추천으로 변경
                like.setLikeType("dislike");
                postLikeRepository.save(like);
                userStatus = "dislike";
            }
        } else {
            // 새로운 비추천 추가
            PostLike newLike = new PostLike();
            newLike.setPostId(postId);
            newLike.setUserId(user.getId());
            newLike.setLikeType("dislike");
            postLikeRepository.save(newLike);
            userStatus = "dislike";
        }
        
        int likeCount = postLikeRepository.countByPostIdAndLikeType(postId, "like");
        int dislikeCount = postLikeRepository.countByPostIdAndLikeType(postId, "dislike");
        
        return PostLikeResponse.builder()
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .userStatus(userStatus)
                .build();
    }
    
    public PostLikeResponse getLikeStatus(Long postId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        Optional<PostLike> existingLike = postLikeRepository.findByPostIdAndUserId(postId, user.getId());
        
        String userStatus = null;
        if (existingLike.isPresent()) {
            userStatus = existingLike.get().getLikeType();
        }
        
        int likeCount = postLikeRepository.countByPostIdAndLikeType(postId, "like");
        int dislikeCount = postLikeRepository.countByPostIdAndLikeType(postId, "dislike");
        
        return PostLikeResponse.builder()
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .userStatus(userStatus)
                .build();
    }
    
    public List<CommentResponse> getComments(Long postId) {
        // 부모 댓글만 가져오기 (parentId가 null인 것들)
        List<Comment> parentComments = commentRepository.findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(postId);
        
        return parentComments.stream()
                .map(this::convertToCommentResponseWithReplies)
                .collect(Collectors.toList());
    }
    
    public CommentResponse createComment(Long postId, String content, Long parentId, String username) {
        // 사용자 정지 상태 확인
        userService.checkUserSuspensionStatus(username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        // 대댓글인 경우 부모 댓글 존재 확인
        if (parentId != null) {
            commentRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("부모 댓글을 찾을 수 없습니다."));
        }
        
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(user.getId());
        comment.setAuthorNickname(user.getNickname());
        comment.setContent(content);
        comment.setParentId(parentId);
        comment.setCreatedAt(LocalDateTime.now());
        
        Comment savedComment = commentRepository.save(comment);
        return convertToCommentResponse(savedComment);
    }
    
    public CommentResponse updateComment(Long commentId, String content, String username) {
        // 사용자 정지 상태 확인
        userService.checkUserSuspensionStatus(username);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!comment.getUserId().equals(user.getId())) {
            throw new RuntimeException("댓글을 수정할 권한이 없습니다.");
        }
        
        comment.setContent(content);
        comment.setUpdatedAt(LocalDateTime.now());
        
        Comment updatedComment = commentRepository.save(comment);
        return convertToCommentResponse(updatedComment);
    }
    
    public void deleteComment(Long commentId, String username) {
        // 사용자 정지 상태 확인
        userService.checkUserSuspensionStatus(username);
        
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!comment.getUserId().equals(user.getId())) {
            throw new RuntimeException("댓글을 삭제할 권한이 없습니다.");
        }
        
        // 대댓글들도 함께 삭제
        List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(commentId);
        commentRepository.deleteAll(replies);
        
        commentRepository.delete(comment);
    }
    
    private CommentResponse convertToCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .authorNickname(comment.getAuthorNickname())
                .content(comment.getContent())
                .parentId(comment.getParentId())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
    
    private CommentResponse convertToCommentResponseWithReplies(Comment comment) {
        // 대댓글들 가져오기
        List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(comment.getId());
        List<CommentResponse> replyResponses = replies.stream()
                .map(this::convertToCommentResponse)
                .collect(Collectors.toList());
        
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .authorNickname(comment.getAuthorNickname())
                .content(comment.getContent())
                .parentId(comment.getParentId())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .replies(replyResponses)
                .build();
    }
    
    private PostResponse convertToResponse(Post post) {
        int commentCount = commentRepository.countByPostId(post.getId());
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .author(post.getAuthorNickname())
                .viewCount(post.getViewCount())
                .hasImages(post.getHasImages())
                .commentCount(commentCount)
                .createdAt(post.getCreatedAt())
                .build();
    }
}