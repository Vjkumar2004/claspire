import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // port 587 uses STARTTLS which starts unencrypted and upgrades
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const fromUser = process.env.SMTP_USER || 'noreply@claspire.in'
  const mailOptions = {
    from: `"Claspire" <${fromUser}>`,
    to,
    subject,
    html,
    text,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent via Gmail SMTP successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email via SMTP transporter:', error)
    throw error
  }
}
