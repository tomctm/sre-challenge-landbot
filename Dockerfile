FROM node:18-alpine AS base

# Build Project
FROM base AS builder
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn --frozen-lockfile
RUN yarn build

# Run dev server
FROM deps AS dev
WORKDIR /app
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000

ENV PORT 3000

CMD ["yarn", "dev"]


# Production image, copy all the files and run next
FROM builder AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]