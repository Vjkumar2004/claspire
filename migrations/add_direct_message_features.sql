-- Reply, edit tracking for direct messages
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to_id ON public.direct_messages(reply_to_id);
