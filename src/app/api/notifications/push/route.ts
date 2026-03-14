import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { receiver_ids, title, message, url } = await req.json()

    if (!receiver_ids?.length) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        include_player_ids: receiver_ids,
        headings: { en: title },
        contents: { en: message },
        url: url || 'http://localhost:3000/community',
        chrome_web_icon: 'https://claspire.vercel.app/logo.png',
        web_push_topic: 'claspire'
      })
    })

    const data = await response.json()
    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    console.error('Push notif error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
