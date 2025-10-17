# 1️⃣ Stage: deps
FROM node:20-alpine AS deps
WORKDIR /app
ENV CI=true
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2️⃣ Stage: build
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3️⃣ Stage: runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN mkdir -p /app/logs /app/uploads

# dependencies and build artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# 👇 добавляем эту строку (вот чего не хватает)
COPY prisma ./prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/ || exit 1

COPY start.sh ./start.sh
RUN chmod +x ./start.sh
CMD ["./start.sh"]