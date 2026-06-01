ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (
  type = ANY (
    ARRAY[
      'post_like',
      'post_answered',
      'job_post',
      'referral_approved',
      'referral_request',
      'post_in_community',
      'post_upvoted',
      'new_job',
      'message_request',
      'message_request_accepted',
      'message_request_rejected',
      'group_created',
      'group_join_request',
      'group_join_accepted',
      'group_join_rejected',
      'senior_connect_request',
      'senior_connect_accepted',
      'senior_connect_declined'
    ]::text[]
  )
);
