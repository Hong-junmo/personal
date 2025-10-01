import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiDelete } from '../utils/api'

const ME = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({
        username: '',
        newUsername: '',
        nickname: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // 로그인 상태 확인
        const token = localStorage.getItem('token');
        const nickname = localStorage.getItem('nickname');

        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        // 사용자 정보 가져오기
        fetchUserInfo();
        checkAdminRole();
    }, [navigate]);

    const fetchUserInfo = async () => {
        try {
            const response = await apiGet('/api/users/profile');

            if (response.ok) {
                const data = await response.json();
                setUserInfo(prev => ({
                    ...prev,
                    username: data.username,
                    nickname: data.nickname,
                    newUsername: data.username
                }));
            }
        } catch (error) {
            console.error('사용자 정보 조회 오류:', error);
        }
    };

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



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleChangeUsername = async () => {
        if (!userInfo.newUsername || userInfo.newUsername.trim() === '') {
            alert('새 아이디를 입력해주세요.');
            return;
        }

        if (userInfo.newUsername === userInfo.username) {
            alert('현재 아이디와 동일합니다.');
            return;
        }

        try {
            const response = await apiPost('/api/users/change-username', { newUsername: userInfo.newUsername }, { method: 'PUT' });

            if (response.ok) {
                alert('아이디가 변경되었습니다. 다시 로그인해주세요.');
                localStorage.removeItem('token');
                localStorage.removeItem('nickname');
                navigate('/login');
            } else {
                const errorData = await response.json();
                alert(errorData.message || '아이디 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('아이디 변경 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleUpdateProfile = async () => {
        try {
            // 닉네임 변경 API 호출
            const response = await apiPost('/api/users/update-profile', { nickname: userInfo.nickname }, { method: 'PUT' });

            if (response.ok) {
                localStorage.setItem('nickname', userInfo.nickname);
                alert('프로필이 업데이트되었습니다.');
                window.location.reload(); // 헤더 업데이트를 위해
            } else {
                alert('프로필 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('프로필 업데이트 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleChangePassword = async () => {
        if (userInfo.newPassword !== userInfo.confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (userInfo.newPassword.length < 4) {
            alert('비밀번호는 4자 이상이어야 합니다.');
            return;
        }

        try {
            const response = await apiPost('/api/users/change-password', { newPassword: userInfo.newPassword }, { method: 'PUT' });

            if (response.ok) {
                alert('비밀번호가 변경되었습니다.');
                setUserInfo(prev => ({
                    ...prev,
                    newPassword: '',
                    confirmPassword: ''
                }));
            } else {
                alert('비밀번호 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('nickname');
        alert('로그아웃되었습니다.');
        navigate('/');
    };

    const handleDeleteAccount = async () => {
        if (!confirm('정말로 회원탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        try {
            const response = await apiDelete('/api/users/delete-account');

            if (response.ok) {
                localStorage.removeItem('token');
                localStorage.removeItem('nickname');
                alert('회원탈퇴가 완료되었습니다.');
                navigate('/');
            } else {
                alert('회원탈퇴에 실패했습니다.');
            }
        } catch (error) {
            console.error('회원탈퇴 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const renderProfileTab = () => (
        <div style={{
            padding: '20px',
            maxWidth: '500px',
            margin: '0 auto'
        }}>
            <h2 style={{ marginBottom: '30px', color: '#333' }}>내 프로필</h2>

            {/* 닉네임 변경 */}
            <div style={{ width: '100%', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#555' }}>닉네임 변경</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        name="nickname"
                        value={userInfo.nickname}
                        onChange={handleInputChange}
                        placeholder="새 닉네임"
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        onClick={handleUpdateProfile}
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
                        변경
                    </button>
                </div>
            </div>

            {/* 아이디 변경 */}
            <div style={{ width: '100%', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#555' }}>아이디 변경</h3>
                <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                    현재 아이디: <strong>{userInfo.username}</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        name="newUsername"
                        value={userInfo.newUsername}
                        onChange={handleInputChange}
                        placeholder="새 아이디"
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        onClick={handleChangeUsername}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        변경
                    </button>
                </div>
            </div>

            {/* 비밀번호 변경 */}
            <div style={{ width: '100%', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#555' }}>비밀번호 변경</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        type="password"
                        name="newPassword"
                        value={userInfo.newPassword}
                        onChange={handleInputChange}
                        placeholder="새 비밀번호"
                        style={{
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        value={userInfo.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="새 비밀번호 확인"
                        style={{
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        onClick={handleChangePassword}
                        style={{
                            padding: '10px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        비밀번호 변경
                    </button>
                </div>
            </div>

            {/* 로그아웃 및 회원탈퇴 */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    로그아웃
                </button>

                <button
                    onClick={handleDeleteAccount}
                    style={{
                        padding: '12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    회원탈퇴
                </button>
            </div>
        </div>
    );



    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa'
        }}>
            {/* 왼쪽 사이드바 */}
            <div style={{
                width: '250px',
                backgroundColor: 'white',
                borderRight: '1px solid #ddd',
                padding: '20px 0'
            }}>
                <div style={{
                    padding: '0 20px',
                    marginBottom: '30px'
                }}>
                    <h2 style={{ margin: '0', color: '#333', fontSize: '20px' }}>설정</h2>
                </div>

                <nav>
                    <button
                        style={{
                            width: '100%',
                            padding: '15px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '16px',
                            borderLeft: '4px solid #0056b3'
                        }}
                    >
                        👤 내 프로필
                    </button>
                    
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/master')}
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                backgroundColor: 'transparent',
                                color: '#333',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '16px',
                                borderLeft: '4px solid transparent'
                            }}
                        >
                            🛡️ 관리자 페이지
                        </button>
                    )}
                </nav>
            </div>

            {/* 오른쪽 컨텐츠 영역 */}
            <div style={{
                flex: 1,
                backgroundColor: '#f8f9fa'
            }}>
                {renderProfileTab()}
            </div>
        </div>
    )
}

export default ME