This is the RealHealthPath web app built with [Next.js](https://nextjs.org).

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

## Environment Variables

Create a local `.env.local` file from `.env.example` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

Do not commit secrets.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1. Import this repository in Vercel.
2. In Project Settings -> Environment Variables, add all variables listed above for Production (and Preview if needed).
3. Set your production domain in Supabase Auth URL settings and allowed redirect URLs.
4. Set your production domain as a Stripe allowed return domain and use the live price ID for `STRIPE_PRICE_ID`.
5. Deploy.

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for additional details.
