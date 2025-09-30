import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Board = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    // 로그인 확인
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    fetchPosts();
  }, [navigate]);

  const fetchPosts = async (page = 1) => {
    try {
      const response = await fetch(`http://localhost:8080/api/posts?page=${page}&size=${postsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          // 페이지네이션 응답인 경우
          setPosts(data.content);
          setTotalPages(data.totalPages);
          setCurrentPage(data.number + 1);
        } else {
          // 단순 배열 응답인 경우 (현재 백엔드)
          setPosts(data);
          setTotalPages(Math.ceil(data.length / postsPerPage));
        }
      }
    } catch (error) {
      console.error('게시글 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteClick = () => {
    navigate('/write');
  };

  const handlePostClick = (postId) => {
    navigate(`/read/${postId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchPosts(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 이전 버튼
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          style={{
            padding: '8px 12px',
            margin: '0 2px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          이전
        </button>
      );
    }

    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          style={{
            padding: '8px 12px',
            margin: '0 2px',
            backgroundColor: i === currentPage ? '#007bff' : 'white',
            color: i === currentPage ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: i === currentPage ? 'bold' : 'normal'
          }}
        >
          {i}
        </button>
      );
    }

    // 다음 버튼
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          style={{
            padding: '8px 12px',
            margin: '0 2px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          다음
        </button>
      );
    }

    return pages;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } else {
      return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '10px'
      }}>
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '18px' }}>자유게시판</h2>
          <button
            onClick={handleWriteClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            글쓰기
          </button>
        </div>

        {/* 게시글 목록 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 100px 80px 80px',
          padding: '10px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #eee',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#666'
        }}>
          <div>번호</div>
          <div>제목</div>
          <div>글쓴이</div>
          <div>조회</div>
          <div>시간</div>
        </div>

        {/* 게시글 목록 */}
        {posts.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            게시글이 없습니다.
          </div>
        ) : (
          posts.map((post, index) => (
            <div
              key={post.id}
              onClick={() => handlePostClick(post.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 100px 80px 80px',
                padding: '12px 20px',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div style={{ color: '#666' }}>{posts.length - index}</div>
              <div style={{ 
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {post.hasImages && (
                  <span style={{ color: '#28a745', marginRight: '5px' }}>📷</span>
                )}
                {post.title}
                {post.commentCount > 0 && (
                  <span style={{ color: '#007bff', marginLeft: '5px' }}>
                    [{post.commentCount}]
                  </span>
                )}
              </div>
              <div style={{ color: '#666' }}>{post.author}</div>
              <div style={{ color: '#666' }}>{post.viewCount}</div>
              <div style={{ color: '#666' }}>{formatDate(post.createdAt)}</div>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          gap: '5px'
        }}>
          {renderPagination()}
        </div>
      )}
    </div>
  )
}

export default Board