import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Write = () => {
    const navigate = useNavigate();
    const [postData, setPostData] = useState({
        title: '',
        content: ''
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);

    useEffect(() => {
        // 로그인 확인
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        // URL에서 edit 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        
        if (editId) {
            fetchPostForEdit(editId);
        }
    }, [navigate]);

    const fetchPostForEdit = async (postId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/posts/${postId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPostData({
                    title: data.title,
                    content: data.content
                });
            }
        } catch (error) {
            console.error('게시글 조회 오류:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPostData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length + selectedImages.length > 5) {
            alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
            return;
        }

        // 파일 크기 체크 (5MB 제한)
        const maxSize = 5 * 1024 * 1024;
        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                alert(`${file.name}은(는) 5MB를 초과합니다.`);
                return false;
            }
            return true;
        });

        setSelectedImages(prev => [...prev, ...validFiles]);

        // 미리보기 생성
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(prev => [...prev, {
                    file: file,
                    url: e.target.result,
                    name: file.name
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!postData.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (!postData.content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const editId = urlParams.get('edit');
            
            // FormData 사용하여 이미지와 텍스트 함께 전송
            const formData = new FormData();
            formData.append('title', postData.title);
            formData.append('content', postData.content);

            // 이미지 파일들 추가
            selectedImages.forEach((image, index) => {
                formData.append('images', image);
            });

            const url = editId 
                ? `http://localhost:8080/api/posts/${editId}`
                : 'http://localhost:8080/api/posts';
            
            const method = editId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                    // Content-Type은 FormData 사용 시 자동 설정되므로 제거
                },
                body: formData
            });

            if (response.ok) {
                const message = editId ? '게시글이 수정되었습니다.' : '게시글이 작성되었습니다.';
                alert(message);
                
                if (editId) {
                    navigate(`/read/${editId}`);
                } else {
                    navigate('/board');
                }
            } else {
                const message = editId ? '게시글 수정에 실패했습니다.' : '게시글 작성에 실패했습니다.';
                alert(message);
            }
        } catch (error) {
            console.error('게시글 처리 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleCancel = () => {
        if (postData.title || postData.content || selectedImages.length > 0) {
            if (confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
                navigate('/board');
            }
        } else {
            navigate('/board');
        }
    };

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
                padding: '20px'
            }}>
                <h2 style={{
                    margin: '0 0 20px 0',
                    color: '#333',
                    fontSize: '18px',
                    borderBottom: '2px solid #007bff',
                    paddingBottom: '10px'
                }}>
                    {new URLSearchParams(window.location.search).get('edit') ? '게시글 수정' : '글쓰기'}
                </h2>

                {/* 제목 입력 */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        제목
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={postData.title}
                        onChange={handleInputChange}
                        placeholder="제목을 입력하세요"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* 내용 입력 */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        내용
                    </label>
                    <textarea
                        name="content"
                        value={postData.content}
                        onChange={handleInputChange}
                        placeholder="내용을 입력하세요"
                        rows="15"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                {/* 이미지 업로드 */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        이미지 첨부 (최대 5개, 각 5MB 이하)
                    </label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />

                    {/* 이미지 미리보기 */}
                    {imagePreview.length > 0 && (
                        <div style={{
                            marginTop: '15px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '10px'
                        }}>
                            {imagePreview.map((preview, index) => (
                                <div key={index} style={{
                                    position: 'relative',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        src={preview.url}
                                        alt={preview.name}
                                        style={{
                                            width: '100%',
                                            height: '150px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <button
                                        onClick={() => removeImage(index)}
                                        style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            backgroundColor: 'rgba(255, 0, 0, 0.7)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '25px',
                                            height: '25px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        ×
                                    </button>
                                    <div style={{
                                        padding: '5px',
                                        fontSize: '12px',
                                        color: '#666',
                                        backgroundColor: '#f8f9fa',
                                        textAlign: 'center',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {preview.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 버튼 */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={handleCancel}
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
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        작성완료
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Write