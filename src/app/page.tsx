
'use client'
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import LoginForm from '@/components/LoginForm'
import RegisterForm from '@/components/RegisterForm'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const { user, isLoading } = useAuth()
  const [isLoginMode, setIsLoginMode] = useState(true)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Dashboard />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Wundrsight Booking System</h1>
            <p className="mt-2 text-gray-600">Book your appointment with ease</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoginMode ? (
          <LoginForm onToggleMode={() => setIsLoginMode(false)} />
        ) : (
          <RegisterForm 
            onToggleMode={() => setIsLoginMode(true)}
            onRegistrationSuccess={() => setIsLoginMode(true)}
          />
        )}
      </main>

      
    </div>
  )
}