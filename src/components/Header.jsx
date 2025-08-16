import React from 'react'
import { useNavigate } from 'react-router-dom'

const Header = () => {

    const navigate = useNavigate();
    const mainnav =() => {
      navigate("/");
    }

    const nav = () => {
      navigate("test");
    }



  return (
    <div className='head'>
            <h3 className='logo' onClick={mainnav}>무언가</h3>
            <div className='nav-right'>
                <h3 className='link' onClick={nav}>게시글</h3>
            </div>
    </div>
  )
}
export default Header