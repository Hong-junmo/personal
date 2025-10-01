import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../utils/api'

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [suspensionModal, setSuspensionModal] = useState({ show: false, message: '' });
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            console.log('로그인 시도:', { username, password });

            const response = await fetch('http://localhost:8080/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('로그인 성공:', data);

                // JWT 토큰과 닉네임을 localStorage에 저장
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                if (data.nickname) {
                    localStorage.setItem('nickname', data.nickname);
                }

                // 헤더 업데이트를 위해 이벤트 발생
                window.dispatchEvent(new Event('storage'));

                // Write 페이지로 이동
                navigate('/board');
            } else {
                const errorData = await response.json();
                console.error('로그인 실패:', errorData);
                
                // 정지 메시지인 경우 모달로 표시
                if (errorData.message && (errorData.message.includes('🚫 계정이 정지되었습니다') || errorData.message.includes('🚫 계정이 영구 정지되었습니다'))) {
                    setSuspensionModal({ show: true, message: errorData.message });
                } else {
                    alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
                }
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        }
    };

    const handleSignup = () => {
        navigate('/sign');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            gap: '20px',
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0
        }}>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: '20px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <input
                            type="text"
                            placeholder="아이디"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={handleKeyPress}
                            style={{
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                width: '200px'
                            }}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            style={{
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                width: '200px'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleLogin}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            alignSelf: 'stretch'
                        }}
                    >
                        로그인
                    </button>
                </div>

                <p
                    onClick={handleSignup}
                    style={{
                        margin: '0',
                        marginLeft: '240px',
                        color: '#666',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    회원가입
                </p>
            </div>

            {/* 정지 모달 */}
            {suspensionModal.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '20px'
                        }}>
                            🚫
                        </div>
                        
                        <h2 style={{
                            color: '#dc3545',
                            marginBottom: '20px',
                            fontSize: '24px'
                        }}>
                            {suspensionModal.message.includes('영구 정지') ? '계정이 영구 정지되었습니다' : '계정이 정지되었습니다'}
                        </h2>
                        
                        <div style={{
                            whiteSpace: 'pre-line',
                            lineHeight: '1.6',
                            color: '#333',
                            marginBottom: '30px',
                            fontSize: '16px',
                            textAlign: 'left',
                            backgroundColor: suspensionModal.message.includes('영구 정지') ? '#fff5f5' : '#f8f9fa',
                            padding: '20px',
                            borderRadius: '8px',
                            border: suspensionModal.message.includes('영구 정지') ? '1px solid #fed7d7' : '1px solid #dee2e6'
                        }}>
                            {suspensionModal.message
                                .replace('🚫 계정이 정지되었습니다.\n\n', '')
                                .replace('🚫 계정이 정지되었습니다.', '')
                                .replace('🚫 계정이 영구 정지되었습니다.\n\n', '')
                                .replace('🚫 계정이 영구 정지되었습니다.', '')
                                .trim()}
                        </div>
                        
                        <button
                            onClick={() => setSuspensionModal({ show: false, message: '' })}
                            style={{
                                padding: '12px 30px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Login