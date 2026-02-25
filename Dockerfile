FROM oven/bun:1-slim

WORKDIR /app

COPY package.json ./
RUN bun install

COPY src/ ./src/
COPY tsconfig.json ./

EXPOSE 8080

CMD ["bun", "run", "src/server.ts"]
