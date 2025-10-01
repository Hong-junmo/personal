import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../utils/api'

const Master = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [suspensionMinutes, setSuspensionMinutes] = useState(60);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [isPermanentSuspension, setIsPermanentSuspension] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // 로그인 확인
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        fetchUsers();
        checkAdminRole();
    }, [navigate]);

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

    const fetchUsers = async () => {
        try {
            const response = await apiGet('/api/admin/users');

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                const errorData = await response.json();
                alert(errorData.message || '사용자 목록을 불러오는데 실패했습니다.');
                navigate('/');
            }
        } catch (error) {
            console.error('사용자 목록 조회 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSuspendUser = async (userId) => {
        if (!suspensionReason.trim()) {
            alert('정지 사유를 입력해주세요.');
            return;
        }

        const confirmMessage = isPermanentSuspension
            ? '정말로 이 사용자를 영구 정지시키겠습니까?'
            : `정말로 이 사용자를 ${suspensionMinutes}분 동안 정지시키겠습니까?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await apiPost('/api/admin/users/suspend', {
                userId: userId,
                suspensionMinutes: isPermanentSuspension ? -1 : suspensionMinutes,
                reason: suspensionReason
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message || '사용자가 정지되었습니다.');
                fetchUsers();
                setSelectedUser(null);
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

    const handleUpdateRole = async (userId, newRole) => {
        if (!confirm(`정말로 이 사용자의 역할을 ${newRole}로 변경하시겠습니까?`)) {
            return;
        }

        try {
            const response = await apiPost('/api/admin/users/role', {
                userId: userId,
                role: newRole
            });

            if (response.ok) {
                alert('사용자 역할이 변경되었습니다.');
                fetchUsers();
            } else {
                const errorData = await response.json();
                alert(errorData.message || '역할 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('역할 변경 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleUnsuspendUser = async (userId, username) => {
        if (!confirm(`정말로 사용자 "${username}"의 정지를 해제하시겠습니까?`)) {
            return;
        }

        try {
            const response = await apiPost(`/api/admin/users/${userId}/unsuspend`);

            if (response.ok) {
                const data = await response.json();
                alert(data.message || '사용자 정지가 해제되었습니다.');
                fetchUsers();
            } else {
                const errorData = await response.json();
                alert(errorData.message || '정지 해제에 실패했습니다.');
            }
        } catch (error) {
            console.error('정지 해제 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!confirm(`정말로 사용자 "${username}"를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            const response = await apiDelete(`/api/admin/users/${userId}`);

            if (response.ok) {
                alert('사용자가 삭제되었습니다.');
                fetchUsers();
            } else {
                const errorData = await response.json();
                alert(errorData.message || '사용자 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('사용자 삭제 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const getSuspensionStatus = (user) => {
        if (!user.isSuspended) return '정상';
        if (!user.suspensionEndTime) return '영구 정지';

        const endTime = new Date(user.suspensionEndTime);
        const now = new Date();

        if (endTime > now) {
            return `정지됨 (${formatDate(user.suspensionEndTime)}까지)`;
        } else {
            return '정지 해제됨';
        }
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
    }

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
                        onClick={() => navigate('/me')}
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
                        👤 내 프로필
                    </button>
                    
                    {isAdmin && (
                        <button
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '16px',
                                borderLeft: '4px solid #c82333'
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
                backgroundColor: '#f8f9fa',
                padding: '20px'
            }}>
                <h1 style={{ marginBottom: '30px', color: '#333' }}>🛡️ 관리자 페이지</h1>

            <div style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderBottom: '1px solid #ddd'
                }}>
                    <h2 style={{ margin: '0', fontSize: '18px' }}>사용자 관리</h2>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>사용자명</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>닉네임</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>역할</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>상태</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>가입일</th>
                                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{user.id}</td>
                                    <td style={{ padding: '12px' }}>{user.username}</td>
                                    <td style={{ padding: '12px' }}>{user.nickname}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            backgroundColor: user.role === 'ADMIN' ? '#dc3545' : '#28a745',
                                            color: 'white'
                                        }}>
                                            {user.role === 'ADMIN' ? '관리자' : '사용자'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            color: user.isSuspended ? '#dc3545' : '#28a745',
                                            fontWeight: 'bold'
                                        }}>
                                            {getSuspensionStatus(user)}
                                        </span>
                                        {user.suspensionReason && (
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                사유: {user.suspensionReason}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>{formatDate(user.createdAt)}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            {user.role !== 'ADMIN' && (
                                                <>
                                                    {!user.isSuspended ? (
                                                        <button
                                                            onClick={() => setSelectedUser(user)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                fontSize: '12px',
                                                                backgroundColor: '#ffc107',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            정지
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUnsuspendUser(user.id, user.username)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                fontSize: '12px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            해제
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleUpdateRole(user.id, 'ADMIN')}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        관리자로
                                                    </button>
                                                </>
                                            )}
                                            {user.role === 'ADMIN' && (
                                                <button
                                                    onClick={() => handleUpdateRole(user.id, 'USER')}
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: '12px',
                                                        backgroundColor: '#6c757d',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    사용자로
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.username)}
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 사용자 정지 모달 */}
            {selectedUser && (
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
                        <h3 style={{ marginTop: 0 }}>사용자 정지</h3>
                        <p><strong>사용자:</strong> {selectedUser.nickname} ({selectedUser.username})</p>

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
                            <label style={{ display: 'block', marginBottom: '10px' }}>정지 유형:</label>
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
                                    <label style={{ display: 'block', marginBottom: '5px' }}>정지 시간:</label>
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
                            <label style={{ display: 'block', marginBottom: '5px' }}>정지 사유:</label>
                            <textarea
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                                placeholder="정지 사유를 입력하세요..."
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
                                onClick={() => handleSuspendUser(selectedUser.id)}
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
                                    setSelectedUser(null);
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
            </div>
        </div>
    )
}

export default Master