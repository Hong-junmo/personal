import { useState } from 'react'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/Header'
import Write from './page/Write'
import Main from './page/Main'
import { Route, Router, Routes } from 'react-router-dom'

function App() {

  return (
    <div>
      <Header />
      <Routes>
        <Route path='/' element={<Main />} />
        <Route path='test' element={<Write />} />
      </Routes>
    </div>
  )
}

export default App
