## Running

### Requirements:

- Ollama installed with the `ollama serve` command available in the terminal (run ollama run llama3.2 after you install to get the right model)
- Tesseract installed and in your PATH (run `tesseract` in the terminal to check)
- pip install pandas pytesseract PIL fastapi uvicorn ollama
- `npm install` in the `expense-showcase` directory

## Running the server: `python3 main.py`

## Running Ollama: `ollama serve`

## Running the client: `npm run dev`

## Showcase:

Run the server, ollama, and client.

1. Go to `http://localhost:3000/reconciliate` and upload the files in the `expense-showcase/files` directory.
2. Submit and wait for the results.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
