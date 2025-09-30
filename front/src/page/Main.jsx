import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Main = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 로그인 상태 확인
    const token = localStorage.getItem('token');
    if (token) {
      // 로그인된 상태라면 Board 페이지로 리다이렉트
      navigate('/board');
    }
  }, [navigate]);

  return (
    <div>
      <img className='image' src='/KakaoTalk_20250105_183207121.gif' />
      <p className='maintext'>싱글벙글 타자교실</p>
    </div>
  )
}

export default Main