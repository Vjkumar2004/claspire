'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
  buttonId: string;
}

export default function GoogleSignInButton({ onSuccess, onError, buttonId }: GoogleSignInButtonProps) {
  useEffect(() => {
    const handleCredentialResponse = (response: any) => {
      if (response?.credential) {
        onSuccess(response.credential)
      } else {
        if (onError) onError('No credential received from Google.')
      }
    }

    const initGsi = () => {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            itp_support: true,
          })

          const btnContainer = document.getElementById(buttonId)
          if (btnContainer) {
            window.google.accounts.id.renderButton(btnContainer, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              width: '392', // Matches the design container size perfectly
              logo_alignment: 'left',
            })
          }
        }
      } catch (err: any) {
        console.error('Error initializing GSI:', err)
        if (onError) onError('Failed to load Google Sign-In helper.')
      }
    }

    // Load GSI client script if not already present
    if (!document.getElementById('gsi-client-script')) {
      const script = document.createElement('script')
      script.id = 'gsi-client-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true;
      script.defer = true;
      script.onload = initGsi
      document.head.appendChild(script)
    } else {
      // Script already loaded, trigger init directly
      initGsi()
    }
  }, [onSuccess, onError, buttonId])

  return (
    <div className="w-full flex justify-center mb-4 min-h-[44px]">
      <div id={buttonId} className="w-full flex justify-center" />
    </div>
  )
}
