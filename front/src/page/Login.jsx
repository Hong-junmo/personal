import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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
                alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
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

        </div>
    )
}

export default Login