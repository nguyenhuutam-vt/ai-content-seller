This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## GitHub AI Code Review

Repo này có workflow `.github/workflows/ai-code-review.yml` để review code tự động trên GitHub.

Để bật AI review:

1. Vào GitHub repo > Settings > Secrets and variables > Actions.
2. Tạo repository secret tên `OPENAI_API_KEY`.
3. Push code lên branch và mở Pull Request vào `main`.

Không commit API key trực tiếp vào repo.

Khi có Pull Request mới hoặc có commit mới được push vào Pull Request, workflow sẽ:

- chạy `npm ci`, `npm run lint`, và `npm run build`;
- chạy Codex ở chế độ `read-only`;
- comment kết quả review vào Pull Request bằng tiếng Việt.

Workflow cũng chạy lint/build trên mọi push. AI review chỉ comment trên Pull Request vì GitHub gắn review/comment vào Pull Request, không gắn trực tiếp vào push thường.

Mặc định workflow dùng `gpt-5.4-mini` với `effort: low` để giữ chi phí thấp. Có thể đổi `effort` sang `medium` trong workflow nếu cần review sâu hơn.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
