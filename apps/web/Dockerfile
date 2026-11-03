FROM node:22.16.0-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.34.9 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/matrix-adapter/package.json packages/matrix-adapter/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
COPY packages/matrix-adapter packages/matrix-adapter
COPY tsconfig.base.json tsconfig.base.json
EXPOSE 5173
CMD ["pnpm", "--filter", "@xplink/web", "dev", "--host", "0.0.0.0"]
