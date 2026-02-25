FROM oven/bun:1-slim

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY src/ ./src/
COPY tsconfig.json ./

EXPOSE 8080

CMD ["bun", "run", "src/server.ts"]
