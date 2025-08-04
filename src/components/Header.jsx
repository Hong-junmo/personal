import React from 'react'
import Text from '../page/Cal'
import Main from './Main'
import { useNavigate } from 'react-router-dom'

const Header = () => {

  const navigate = useNavigate();
  const mainnav = () => {
    navigate("/");
  }

  const nav = () => {
    navigate("test");
  }

  const calnav = () => {
    navigate("cal");
  }



  return (
    <div className='head'>
      <h3 className='logo' onClick={mainnav}>무언가</h3>
      <h3 className='link' onClick={nav}>게시글</h3>
      <h3 className='title' onClick={calnav}>계산기</h3>
      <p>테스트</p>
    </div>
  )
}
export default Header