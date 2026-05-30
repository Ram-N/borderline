import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // detectSessionInUrl handles the PKCE exchange automatically.
    // Listen for the session, with a getSession() fallback for the race condition
    // where the exchange completes before this listener is set up.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        subscription.unsubscribe()
        navigate('/', { replace: true })
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        subscription.unsubscribe()
        navigate('/', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return <p style={{ textAlign: 'center', marginTop: 40 }}>Signing in…</p>
}
