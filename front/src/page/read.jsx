import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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

    useEffect(() => {
        // 로그인 확인
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        fetchPost();

        // 현재 사용자 정보 가져오기
        const nickname = localStorage.getItem('nickname');
        setCurrentUser(nickname || '');
    }, [id, navigate]);

    const fetchPost = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/posts/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPost(data);

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
            const response = await fetch(`http://localhost:8080/api/posts/${postId}/images`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

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
            const response = await fetch(`http://localhost:8080/api/posts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

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
            const response = await fetch(`http://localhost:8080/api/posts/${id}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

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
            const response = await fetch(`http://localhost:8080/api/posts/${id}/dislike`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

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
            const response = await fetch(`http://localhost:8080/api/posts/${postId}/like-status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

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
            const response = await fetch(`http://localhost:8080/api/posts/${postId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

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
            const response = await fetch(`http://localhost:8080/api/posts/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    content: newComment
                })
            });

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
                            <span>조회수: {post.viewCount}</span>
                            {post.hasImages && (
                                <span style={{ color: '#28a745' }}>📷 이미지 포함</span>
                            )}
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
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>
                    댓글 ({comments.length})
                </h3>



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
                        <div
                            key={comment.id}
                            style={{
                                padding: '15px',
                                borderBottom: index < comments.length - 1 ? '1px solid #f0f0f0' : 'none',
                                marginBottom: index < comments.length - 1 ? '15px' : '0'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                            }}>
                                <span style={{
                                    fontWeight: 'bold',
                                    color: '#333',
                                    fontSize: '14px'
                                }}>
                                    {comment.authorNickname}
                                </span>
                                <span style={{
                                    color: '#666',
                                    fontSize: '12px'
                                }}>
                                    {formatDate(comment.createdAt)}
                                </span>
                            </div>
                            <div style={{
                                color: '#333',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {comment.content}
                            </div>
                        </div>
                    ))
                )}

                {/* 댓글 작성 */}
                <div style={{
                    marginTop: '30px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    borderTop: '1px solid #ddd'
                }}>
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
                        rows="3"
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export default Read