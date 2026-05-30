export const MESSAGE_MODIFY_WINDOW_MS = 7 * 60 * 60 * 1000 // 7 hours

export function canModifyMessage(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < MESSAGE_MODIFY_WINDOW_MS
}

export type DirectMessageRow = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  conversation_id: string
  is_read?: boolean
  reply_to_id?: string | null
  edited_at?: string | null
  reply_to?: {
    id: string
    content: string
    sender_id: string
  } | null
}
