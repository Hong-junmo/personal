import { useState } from 'react'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/Header'
import Cal from './components/Cal'
import Main from './components/Main'
import { Route, Router, Routes } from 'react-router-dom'
import Write from './components/Write'

function App() {

  return (
    <div>
    <Header/>
    <Routes>
      <Route path='/' element={<Main/>}/>
      <Route path='test' element={<Write/>}/>
      <Route path='cal' element={<Cal/>}/>
    </Routes>
    </div>
  )
}

export default App
