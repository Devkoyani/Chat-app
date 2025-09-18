import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import {Toaster} from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'

const App = () => {

  const { authUser, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-800 text-white">
        <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="bg-[url('/bgImage.svg')] bg-contain">
      <Toaster />
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login"/>} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login"/>} />
      </Routes>
    </div>
  )
}

export default App
