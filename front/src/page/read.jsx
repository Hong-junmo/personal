import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiPost, apiDelete } from '../utils/api'

const Read = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState([]);
    const [currentUser, setCurrentUser] = useState('');
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [userLikeStatus, setUserLikeStatus] = useState(null); // 'like', 'dislike', null
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [viewCount, setViewCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [suspensionMinutes, setSuspensionMinutes] = useState(60);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [selectedComment, setSelectedComment] = useState(null);
    const [showCommentAdminModal, setShowCommentAdminModal] = useState(false);
    const [isPermanentSuspension, setIsPermanentSuspension] = useState(false);
    const [isCommentPermanentSuspension, setIsCommentPermanentSuspension] = useState(false);

    useEffect(() => {
        // 로그인 확인
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        fetchPost();
        checkAdminRole();

        // 현재 사용자 정보 가져오기
        const nickname = localStorage.getItem('nickname');
        setCurrentUser(nickname || '');
    }, [id, navigate]);

    const checkAdminRole = async () => {
        try {
            const response = await apiGet('/api/admin/check-role');

            if (response.ok) {
                const data = await response.json();
                setIsAdmin(data.isAdmin);
            }
        } catch (error) {
            console.error('관리자 권한 확인 오류:', error);
        }
    };

    const handleAdminDeletePost = async () => {
        if (!confirm('관리자 권한으로 이 게시글을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await apiDelete(`/api/admin/posts/${id}`);

            if (response.ok) {
                alert('게시글이 삭제되었습니다.');
                navigate('/board');
            } else {
                const errorData = await response.json();
                alert(errorData.message || '게시글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleSuspendAuthor = async () => {
        if (!suspensionReason.trim()) {
            alert('정지 사유를 입력해주세요.');
            return;
        }

        const confirmMessage = isPermanentSuspension 
            ? '정말로 이 게시글 작성자를 영구 정지시키겠습니까?' 
            : `정말로 이 게시글 작성자를 ${suspensionMinutes}분 동안 정지시키겠습니까?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await apiPost(`/api/admin/posts/${id}/suspend-author`, {
                suspensionMinutes: isPermanentSuspension ? -1 : suspensionMinutes,
                reason: suspensionReason
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message || '게시글 작성자가 정지되었습니다.');
                setShowAdminModal(false);
                setSuspensionReason('');
                setIsPermanentSuspension(false);
            } else {
                const errorData = await response.json();
                alert(errorData.message || '사용자 정지에 실패했습니다.');
            }
        } catch (error) {
            console.error('사용자 정지 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleSuspendCommentAuthor = async () => {
        if (!suspensionReason.trim()) {
            alert('정지 사유를 입력해주세요.');
            return;
        }

        const confirmMessage = isCommentPermanentSuspension 
            ? '정말로 이 댓글 작성자를 영구 정지시키겠습니까?' 
            : `정말로 이 댓글 작성자를 ${suspensionMinutes}분 동안 정지시키겠습니까?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await apiPost(`/api/admin/comments/${selectedComment.id}/suspend-author`, {
                suspensionMinutes: isCommentPermanentSuspension ? -1 : suspensionMinutes,
                reason: suspensionReason
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message || '댓글 작성자가 정지되었습니다.');
                setShowCommentAdminModal(false);
                setSelectedComment(null);
                setSuspensionReason('');
                setIsCommentPermanentSuspension(false);
            } else {
                const errorData = await response.json();
                alert(errorData.message || '사용자 정지에 실패했습니다.');
            }
        } catch (error) {
            console.error('사용자 정지 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleAdminDeleteComment = async (commentId) => {
        if (!confirm('관리자 권한으로 이 댓글을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await apiDelete(`/api/admin/comments/${commentId}`);

            if (response.ok) {
                alert('댓글이 삭제되었습니다.');
                fetchComments(id);
            } else {
                const errorData = await response.json();
                alert(errorData.message || '댓글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 삭제 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const increaseViewCount = async (postId) => {
        try {
            // 현재 사용자와 게시글 ID를 조합한 고유 키 생성
            const currentUser = localStorage.getItem('nickname') || 'anonymous';
            const viewKey = `viewed_${currentUser}_${postId}`;

            // 이미 조회한 게시글인지 확인 (로컬 스토리지 사용)
            const viewedTime = localStorage.getItem(viewKey);
            if (viewedTime) {
                const now = new Date().getTime();
                const expireTime = parseInt(viewedTime);

                // 24시간이 지나지 않았다면 조회수 증가하지 않음
                if (now < expireTime) {
                    console.log('이미 조회한 게시글이므로 조회수 증가하지 않음 (24시간 내)');
                    return;
                } else {
                    // 24시간이 지났다면 기록 삭제
                    localStorage.removeItem(viewKey);
                }
            }

            console.log('조회수 증가 API 호출 중...');
            const response = await apiPost(`/api/posts/${postId}/view`);

            console.log('조회수 증가 API 응답:', response.status);

            if (response.ok) {
                // 조회 기록을 로컬 스토리지에 저장 (24시간 후 만료)
                const expireTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24시간
                localStorage.setItem(viewKey, expireTime.toString());
                console.log('조회수 증가 성공, 24시간 동안 중복 방지');

                // 실시간으로 조회수 업데이트
                setViewCount(prevCount => {
                    const newCount = prevCount + 1;
                    console.log('조회수 실시간 업데이트:', newCount);
                    return newCount;
                });
            } else {
                console.error('조회수 증가 실패:', response.status);
            }
        } catch (error) {
            console.error('조회수 증가 오류:', error);
        }
    };

    const fetchPost = async () => {
        try {
            const response = await apiGet(`/api/posts/${id}`);

            if (response.ok) {
                const data = await response.json();
                setPost(data);
                setViewCount(data.viewCount); // 조회수 별도 상태로 설정

                // 조회수 증가 (한 번만 호출)
                increaseViewCount(id);

                // 이미지 정보 가져오기
                if (data.hasImages) {
                    fetchImages(id);
                }

                // 좋아요/비추천 정보 가져오기
                fetchLikeStatus(id);

                // 댓글 정보 가져오기
                fetchComments(id);
            } else {
                alert('게시글을 찾을 수 없습니다.');
                navigate('/board');
            }
        } catch (error) {
            console.error('게시글 조회 오류:', error);
            alert('게시글을 불러오는데 실패했습니다.');
            navigate('/board');
        } finally {
            setLoading(false);
        }
    };

    const fetchImages = async (postId) => {
        try {
            const response = await apiGet(`/api/posts/${postId}/images`);

            if (response.ok) {
                const imageData = await response.json();
                setImages(imageData);
            }
        } catch (error) {
            console.error('이미지 조회 오류:', error);
        }
    };

    const handleBackToList = () => {
        navigate('/board');
    };

    const handleEdit = () => {
        navigate(`/write?edit=${id}`);
    };

    const handleDelete = async () => {
        if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await apiDelete(`/api/posts/${id}`);

            if (response.ok) {
                alert('게시글이 삭제되었습니다.');
                navigate('/board');
            } else {
                alert('게시글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleLike = async () => {
        try {
            const response = await apiPost(`/api/posts/${id}/like`);

            if (response.ok) {
                const data = await response.json();
                setLikeCount(data.likeCount);
                setDislikeCount(data.dislikeCount);
                setUserLikeStatus(data.userStatus);
            }
        } catch (error) {
            console.error('좋아요 오류:', error);
        }
    };

    const handleDislike = async () => {
        try {
            const response = await apiPost(`/api/posts/${id}/dislike`);

            if (response.ok) {
                const data = await response.json();
                setLikeCount(data.likeCount);
                setDislikeCount(data.dislikeCount);
                setUserLikeStatus(data.userStatus);
            }
        } catch (error) {
            console.error('비추천 오류:', error);
        }
    };

    const fetchLikeStatus = async (postId) => {
        try {
            const response = await apiGet(`/api/posts/${postId}/like-status`);

            if (response.ok) {
                const data = await response.json();
                setLikeCount(data.likeCount);
                setDislikeCount(data.dislikeCount);
                setUserLikeStatus(data.userStatus);
            }
        } catch (error) {
            console.error('좋아요 상태 조회 오류:', error);
        }
    };

    const fetchComments = async (postId) => {
        try {
            const response = await apiGet(`/api/posts/${postId}/comments`);

            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error('댓글 조회 오류:', error);
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        try {
            const response = await apiPost(`/api/posts/${id}/comments`, { content: newComment });

            if (response.ok) {
                setNewComment('');
                fetchComments(id); // 댓글 목록 새로고침
            } else {
                alert('댓글 작성에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 작성 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleCommentEdit = (comment) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
    };

    const handleCommentUpdate = async (commentId) => {
        if (!editContent.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        try {
            const response = await apiPost(`/api/comments/${commentId}`, { content: editContent }, { method: 'PUT' });

            if (response.ok) {
                setEditingComment(null);
                setEditContent('');
                fetchComments(id);
            } else {
                alert('댓글 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 수정 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleCommentDelete = async (commentId) => {
        if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await apiDelete(`/api/comments/${commentId}`);

            if (response.ok) {
                fetchComments(id);
            } else {
                alert('댓글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 삭제 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleReplySubmit = async (parentId) => {
        if (!replyContent.trim()) {
            alert('답글 내용을 입력해주세요.');
            return;
        }

        try {
            const response = await apiPost(`/api/posts/${id}/comments`, {
                content: replyContent,
                parentId: parentId
            });

            if (response.ok) {
                setReplyingTo(null);
                setReplyContent('');
                fetchComments(id);
            } else {
                alert('답글 작성에 실패했습니다.');
            }
        } catch (error) {
            console.error('답글 작성 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    // 현재 사용자가 작성자인지 확인
    const isAuthor = currentUser === post?.author;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
    }

    if (!post) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>게시글을 찾을 수 없습니다.</div>;
    }

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                {/* 게시글 헤더 */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #eee',
                    backgroundColor: '#f8f9fa'
                }}>
                    <h1 style={{
                        margin: '0 0 15px 0',
                        fontSize: '24px',
                        color: '#333',
                        lineHeight: '1.4'
                    }}>
                        {post.title}
                    </h1>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <span>작성자: <strong>{post.author}</strong></span>
                            <span>조회수: {viewCount}</span>
                        </div>
                        <span>{formatDate(post.createdAt)}</span>
                    </div>
                </div>

                {/* 게시글 내용 */}
                <div style={{
                    padding: '30px',
                    minHeight: '300px',
                    lineHeight: '1.8',
                    fontSize: '16px',
                    color: '#333'
                }}>
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {post.content}
                    </div>

                    {/* 이미지 표시 영역 */}
                    {post.hasImages && images.length > 0 && (
                        <div style={{
                            marginTop: '30px'
                        }}>
                            {images.map((image, index) => (
                                <div key={index} style={{ marginBottom: '20px' }}>
                                    <img
                                        src={`http://localhost:8080/uploads/images/${image.storedFilename}`}
                                        alt={image.originalFilename}
                                        style={{
                                            maxWidth: '100%',
                                            height: 'auto',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <div style={{
                                        display: 'none',
                                        padding: '20px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '4px',
                                        textAlign: 'center',
                                        color: '#666',
                                        border: '1px solid #ddd'
                                    }}>
                                        이미지를 불러올 수 없습니다: {image.originalFilename}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {post.hasImages && images.length === 0 && (
                        <div style={{
                            marginTop: '30px',
                            padding: '20px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            textAlign: 'center',
                            color: '#666'
                        }}>
                            이미지 로딩 중...
                        </div>
                    )}
                </div>

                {/* 버튼 영역 */}
                <div style={{
                    padding: '20px',
                    borderTop: '1px solid #eee',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <button
                        onClick={handleBackToList}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        목록으로
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {isAuthor && (
                            <>
                                <button
                                    onClick={handleEdit}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#ffc107',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    수정
                                </button>
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    삭제
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleLike}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: userLikeStatus === 'like' ? '#28a745' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            👍 추천 ({likeCount})
                        </button>
                        <button
                            onClick={handleDislike}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: userLikeStatus === 'dislike' ? '#dc3545' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            👎 비추 ({dislikeCount})
                        </button>
                        
                        {/* 관리자 전용 버튼들 */}
                        {isAdmin && !isAuthor && (
                            <>
                                <button
                                    onClick={() => setShowAdminModal(true)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#ffc107',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    🚫 작성자 정지
                                </button>
                                <button
                                    onClick={handleAdminDeletePost}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    🗑️ 관리자 삭제
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 댓글 영역 */}
            <div style={{
                marginTop: '20px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '20px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    margin: '0 0 20px 0',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                }}>
                    <h3 style={{ margin: '0', fontSize: '18px', color: '#495057' }}>
                        💬 댓글
                    </h3>
                    <span style={{
                        fontSize: '14px',
                        color: '#6c757d',
                        backgroundColor: '#e9ecef',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: 'bold'
                    }}>
                        {comments.length}개
                    </span>
                </div>



                {/* 댓글 목록 */}
                {comments.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        첫 번째 댓글을 작성해보세요!
                    </div>
                ) : (
                    comments.map((comment, index) => (
                        <div key={comment.id}>
                            {/* 부모 댓글 */}
                            <div style={{
                                padding: '18px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e9ecef',
                                borderRadius: '8px',
                                marginBottom: '15px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            fontWeight: 'bold',
                                            color: '#333',
                                            fontSize: '14px'
                                        }}>
                                            {comment.authorNickname}
                                        </span>
                                        <span style={{
                                            fontSize: '11px',
                                            color: '#495057',
                                            backgroundColor: '#e9ecef',
                                            padding: '3px 8px',
                                            borderRadius: '12px',
                                            fontWeight: 'bold',
                                            border: '1px solid #adb5bd'
                                        }}>
                                            💬 댓글
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            color: '#666',
                                            fontSize: '12px'
                                        }}>
                                            {formatDate(comment.createdAt)}
                                            {comment.updatedAt && comment.updatedAt !== comment.createdAt && ' (수정됨)'}
                                        </span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {currentUser === comment.authorNickname && (
                                                <>
                                                    <button
                                                        onClick={() => handleCommentEdit(comment)}
                                                        style={{
                                                            padding: '2px 8px',
                                                            fontSize: '12px',
                                                            backgroundColor: '#ffc107',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() => handleCommentDelete(comment.id)}
                                                        style={{
                                                            padding: '2px 8px',
                                                            fontSize: '12px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        삭제
                                                    </button>
                                                </>
                                            )}
                                            {isAdmin && currentUser !== comment.authorNickname && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedComment(comment);
                                                            setShowCommentAdminModal(true);
                                                        }}
                                                        style={{
                                                            padding: '2px 8px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#ffc107',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        🚫 정지
                                                    </button>
                                                    <button
                                                        onClick={() => handleAdminDeleteComment(comment.id)}
                                                        style={{
                                                            padding: '2px 8px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        🗑️ 삭제
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 댓글 내용 또는 수정 폼 */}
                                {editingComment === comment.id ? (
                                    <div style={{ marginBottom: '10px' }}>
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                resize: 'vertical',
                                                boxSizing: 'border-box',
                                                marginBottom: '8px'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                onClick={() => handleCommentUpdate(comment.id)}
                                                style={{
                                                    padding: '5px 10px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                저장
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingComment(null);
                                                    setEditContent('');
                                                }}
                                                style={{
                                                    padding: '5px 10px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        color: '#333',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap',
                                        marginBottom: '10px'
                                    }}>
                                        {comment.content}
                                    </div>
                                )}

                                {/* 답글 버튼 */}
                                <button
                                    onClick={() => {
                                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                        setReplyContent('');
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        backgroundColor: replyingTo === comment.id ? '#dc3545' : '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {replyingTo === comment.id ? '취소' : '답글'}
                                </button>

                                {/* 답글 작성 폼 */}
                                {replyingTo === comment.id && (
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '15px',
                                        backgroundColor: '#f1f3f4',
                                        borderRadius: '8px',
                                        border: '1px solid #adb5bd'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#495057',
                                            marginBottom: '8px',
                                            fontWeight: 'bold'
                                        }}>
                                            💬 {comment.authorNickname}님에게 답글 작성 중...
                                        </div>
                                        <textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="답글을 입력하세요..."
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                resize: 'vertical',
                                                boxSizing: 'border-box',
                                                marginBottom: '10px',
                                                backgroundColor: 'white'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleReplySubmit(comment.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#495057',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                답글 작성
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyContent('');
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 대댓글 목록 */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div style={{ marginLeft: '40px', marginBottom: '15px' }}>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#666',
                                        marginBottom: '8px',
                                        fontWeight: 'bold'
                                    }}>
                                        ↳ 답글 {comment.replies.length}개
                                    </div>
                                    {comment.replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            style={{
                                                padding: '12px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '8px',
                                                marginBottom: '8px',
                                                borderLeft: '4px solid #adb5bd',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '5px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        color: '#007bff',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        ↳
                                                    </span>
                                                    <span style={{
                                                        fontWeight: 'bold',
                                                        color: '#333',
                                                        fontSize: '13px'
                                                    }}>
                                                        {reply.authorNickname}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        color: '#6c757d',
                                                        backgroundColor: '#f1f3f4',
                                                        padding: '3px 8px',
                                                        borderRadius: '12px',
                                                        fontWeight: 'bold',
                                                        border: '1px solid #adb5bd'
                                                    }}>
                                                        ↩️ 답글
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        color: '#666',
                                                        fontSize: '11px'
                                                    }}>
                                                        {formatDate(reply.createdAt)}
                                                        {reply.updatedAt && reply.updatedAt !== reply.createdAt && ' (수정됨)'}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '3px' }}>
                                                        {currentUser === reply.authorNickname && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleCommentEdit(reply)}
                                                                    style={{
                                                                        padding: '1px 6px',
                                                                        fontSize: '11px',
                                                                        backgroundColor: '#ffc107',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '2px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    수정
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCommentDelete(reply.id)}
                                                                    style={{
                                                                        padding: '1px 6px',
                                                                        fontSize: '11px',
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '2px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    삭제
                                                                </button>
                                                            </>
                                                        )}
                                                        {isAdmin && currentUser !== reply.authorNickname && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedComment(reply);
                                                                        setShowCommentAdminModal(true);
                                                                    }}
                                                                    style={{
                                                                        padding: '1px 6px',
                                                                        fontSize: '10px',
                                                                        backgroundColor: '#ffc107',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '2px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    🚫
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAdminDeleteComment(reply.id)}
                                                                    style={{
                                                                        padding: '1px 6px',
                                                                        fontSize: '10px',
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '2px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 대댓글 내용 또는 수정 폼 */}
                                            {editingComment === reply.id ? (
                                                <div>
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        rows="2"
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '3px',
                                                            fontSize: '13px',
                                                            resize: 'vertical',
                                                            boxSizing: 'border-box',
                                                            marginBottom: '6px'
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '3px' }}>
                                                        <button
                                                            onClick={() => handleCommentUpdate(reply.id)}
                                                            style={{
                                                                padding: '3px 8px',
                                                                fontSize: '11px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '2px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            저장
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingComment(null);
                                                                setEditContent('');
                                                            }}
                                                            style={{
                                                                padding: '3px 8px',
                                                                fontSize: '11px',
                                                                backgroundColor: '#6c757d',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '2px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            취소
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    color: '#333',
                                                    fontSize: '13px',
                                                    lineHeight: '1.4',
                                                    whiteSpace: 'pre-wrap'
                                                }}>
                                                    {reply.content}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* 댓글 작성 */}
                <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                }}>
                    <div style={{
                        fontSize: '14px',
                        color: '#495057',
                        marginBottom: '10px',
                        fontWeight: 'bold'
                    }}>
                        💭 새 댓글 작성하기
                    </div>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit();
                            }
                        }}
                        placeholder="댓글을 입력하세요..."
                        rows="4"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '14px',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            backgroundColor: 'white'
                        }}
                    />
                    <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#6c757d',
                        textAlign: 'right'
                    }}>
                    </div>
                </div>
            </div>

            {/* 관리자 정지 모달 */}
            {showAdminModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        width: '400px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#dc3545' }}>🚫 게시글 작성자 정지</h3>
                        <p><strong>게시글:</strong> {post?.title}</p>
                        <p><strong>작성자:</strong> {post?.author}</p>
                        
                        {isPermanentSuspension && (
                            <div style={{
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                                padding: '10px',
                                borderRadius: '4px',
                                marginBottom: '15px',
                                border: '1px solid #f5c6cb'
                            }}>
                                ⚠️ <strong>경고:</strong> 영구 정지는 관리자만 해제할 수 있습니다.
                            </div>
                        )}
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>정지 유형:</label>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                    <input
                                        type="radio"
                                        name="suspensionType"
                                        checked={!isPermanentSuspension}
                                        onChange={() => setIsPermanentSuspension(false)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    기간 정지
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="radio"
                                        name="suspensionType"
                                        checked={isPermanentSuspension}
                                        onChange={() => setIsPermanentSuspension(true)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    <span style={{ color: '#dc3545', fontWeight: 'bold' }}>영구 정지</span>
                                </label>
                            </div>
                            
                            {!isPermanentSuspension && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>정지 시간:</label>
                                    <select
                                        value={suspensionMinutes}
                                        onChange={(e) => setSuspensionMinutes(parseInt(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        <option value={60}>1시간</option>
                                        <option value={360}>6시간</option>
                                        <option value={720}>12시간</option>
                                        <option value={1440}>1일</option>
                                        <option value={4320}>3일</option>
                                        <option value={10080}>7일</option>
                                        <option value={43200}>30일</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>정지 사유:</label>
                            <textarea
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                                placeholder="정지 사유를 입력하세요... (예: 부적절한 게시글 작성)"
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    resize: 'vertical',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSuspendAuthor}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: isPermanentSuspension ? '#721c24' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: isPermanentSuspension ? 'bold' : 'normal'
                                }}
                            >
                                {isPermanentSuspension ? '영구 정지' : '정지'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAdminModal(false);
                                    setSuspensionReason('');
                                    setIsPermanentSuspension(false);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 댓글 작성자 정지 모달 */}
            {showCommentAdminModal && selectedComment && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        width: '400px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#dc3545' }}>🚫 댓글 작성자 정지</h3>
                        <p><strong>댓글 내용:</strong> {selectedComment.content.length > 50 ? selectedComment.content.substring(0, 50) + '...' : selectedComment.content}</p>
                        <p><strong>작성자:</strong> {selectedComment.authorNickname}</p>
                        
                        {isCommentPermanentSuspension && (
                            <div style={{
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                                padding: '10px',
                                borderRadius: '4px',
                                marginBottom: '15px',
                                border: '1px solid #f5c6cb'
                            }}>
                                ⚠️ <strong>경고:</strong> 영구 정지는 관리자만 해제할 수 있습니다.
                            </div>
                        )}
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>정지 유형:</label>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                    <input
                                        type="radio"
                                        name="commentSuspensionType"
                                        checked={!isCommentPermanentSuspension}
                                        onChange={() => setIsCommentPermanentSuspension(false)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    기간 정지
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="radio"
                                        name="commentSuspensionType"
                                        checked={isCommentPermanentSuspension}
                                        onChange={() => setIsCommentPermanentSuspension(true)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    <span style={{ color: '#dc3545', fontWeight: 'bold' }}>영구 정지</span>
                                </label>
                            </div>
                            
                            {!isCommentPermanentSuspension && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>정지 시간:</label>
                                    <select
                                        value={suspensionMinutes}
                                        onChange={(e) => setSuspensionMinutes(parseInt(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        <option value={60}>1시간</option>
                                        <option value={360}>6시간</option>
                                        <option value={720}>12시간</option>
                                        <option value={1440}>1일</option>
                                        <option value={4320}>3일</option>
                                        <option value={10080}>7일</option>
                                        <option value={43200}>30일</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>정지 사유:</label>
                            <textarea
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                                placeholder="정지 사유를 입력하세요... (예: 부적절한 댓글 작성)"
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    resize: 'vertical',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSuspendCommentAuthor}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: isCommentPermanentSuspension ? '#721c24' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: isCommentPermanentSuspension ? 'bold' : 'normal'
                                }}
                            >
                                {isCommentPermanentSuspension ? '영구 정지' : '정지'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCommentAdminModal(false);
                                    setSelectedComment(null);
                                    setSuspensionReason('');
                                    setIsCommentPermanentSuspension(false);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Read