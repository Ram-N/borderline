import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href).finally(() => {
      navigate('/', { replace: true })
    })
  }, [navigate])

  return <p style={{ textAlign: 'center', marginTop: 40 }}>Signing in…</p>
}
