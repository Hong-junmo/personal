import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Sign = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const navigate = useNavigate();

    const handleSignup = async () => {
        if (!username || !password || !nickname) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/users/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                    nickname
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 응답이 JSON인지 확인
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                throw new Error('서버에서 올바르지 않은 응답을 받았습니다.');
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                alert('회원가입이 완료되었습니다!');
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                navigate('/login');
            } else {
                alert(data.message || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
            alert('회원가입 중 오류가 발생했습니다: ' + error.message);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
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
                gap: '15px',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="아이디"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        width: '250px'
                    }}
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        width: '250px'
                    }}
                />
                <input
                    type="text"
                    placeholder="닉네임"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        width: '250px'
                    }}
                />

                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '10px'
                }}>
                    <button
                        onClick={handleSignup}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        회원가입
                    </button>
                    <button
                        onClick={handleBackToLogin}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        로그인으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Sign