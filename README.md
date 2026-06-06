This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

### Required for Rate Limiting (Upstash Redis)

The application uses Upstash Redis for production-grade distributed rate limiting. You must configure these environment variables:

```env
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

To get these credentials:
1. Create a free account at [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and REST token from the database details

**Note**: If Upstash Redis is not configured, the rate limiter will fail open (allow requests) to prevent breaking the application.

### Rate Limiting Configuration

The following endpoints are protected with rate limiting:

**Authentication Endpoints (per IP):**
- Login: 5 requests per minute
- Signup: 3 requests per hour
- Password Reset: 3 requests per hour
- OTP: 5 requests per 15 minutes

**Content Creation Endpoints (per authenticated user):**
- Create Post: 10 requests per minute
- Send Message: 30 requests per minute
- Create Comment: 20 requests per minute

**Voting Endpoints (per authenticated user):**
- Vote Actions: 100 requests per minute

Rate limited requests return HTTP 429 with:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until retry

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
