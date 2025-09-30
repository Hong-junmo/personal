import { useState } from 'react'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/Header'
import Board from './page/Board'
import Write from './page/Write'
import Read from './page/read'
import Main from './page/Main'
import ME from './page/ME'
import { Route, Router, Routes } from 'react-router-dom'
import Login from './page/Login'
import Sign from './page/Sign'

function App() {

  return (
    <div>
      <Header />
      <Routes>
        <Route path='/' element={<Main />} />
        <Route path='/board' element={<Board />} />
        <Route path='/write' element={<Write />} />
        <Route path='/read/:id' element={<Read />} />
        <Route path='/me' element={<ME />} />
        <Route path='login' element={<Login />} />
        <Route path='sign' element={<Sign />} />
      </Routes>
    </div>
  )
}

export default App
