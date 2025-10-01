import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../utils/api'

const Header = () => {

  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userNickname, setUserNickname] = useState('');
  const inputRef = useRef(null);

  // 로그인 상태 및 정지 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('token');
      const nickname = localStorage.getItem('nickname');
      
      if (token && nickname) {
        try {
          // 사용자 프로필 조회로 정지 상태 확인
          const response = await apiGet('/api/users/profile');
          if (response.ok) {
            setIsLoggedIn(true);
            setUserNickname(nickname);
          }
        } catch (error) {
          // API 유틸리티에서 이미 로그아웃 처리됨
          setIsLoggedIn(false);
          setUserNickname('');
        }
      } else {
        setIsLoggedIn(false);
        setUserNickname('');
      }
    };

    // 초기 로드 시 확인
    checkLoginStatus();

    // localStorage 변경 감지
    const handleStorageChange = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 페이지 포커스 시에도 확인 (같은 탭에서의 변경사항 감지)
    window.addEventListener('focus', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', checkLoginStatus);
    };
  }, []);

  const mainnav = () => {
    navigate("/");
  }

  const nav = () => {
    navigate("test");
  }

  const handleLogoClick = () => {
    // 로그인된 상태에서는 Board 페이지로 이동
    if (isLoggedIn) {
      navigate('/board');
      return;
    }
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount === 3) {
      setShowInput(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else if (newCount > 3) {
      setClickCount(0);
      setShowInput(false);
    }
  }

  const handleNicknameClick = () => {
    navigate('/me');
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (e.target.value === '싱글벙글 타자교실') {
        navigate('/login');
      }
      setShowInput(false);
      setClickCount(0);
    }
  }

  return (
    <div className='head'>
            <h3 className='logo' onClick={handleLogoClick}>무언가</h3>
            <div className='nav-right'>
                {isLoggedIn ? (
                  <span 
                    onClick={handleNicknameClick}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 16px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#333'
                    }}
                  >
                    {userNickname}
                  </span>
                ) : (
                  showInput && (
                    <input 
                      ref={inputRef}
                      type="text" 
                      onKeyPress={handleKeyPress}
                      style={{
                        opacity: 0,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '200px',
                        height: '30px',
                        cursor: 'text',
                        pointerEvents: 'auto'
                      }}
                    />
                  )
                )}
            </div>
    </div>
  )
}
export default Header