FROM node:20-slim AS base

FROM base AS web
# Install packages
WORKDIR /app/web
COPY web/package.json web/yarn.lock web/.yarnrc.yml ./
COPY web/.yarn ./.yarn
RUN yarn
# Build
COPY web .

ARG NEXT_PUBLIC_NAVER_ID
ARG NEXT_PUBLIC_THUMBNAIL_URL
ENV NEXT_PUBLIC_NAVER_ID $NEXT_PUBLIC_NAVER_ID
ENV NEXT_PUBLIC_THUMBNAIL_URL $NEXT_PUBLIC_THUMBNAIL_URL

RUN yarn start build

FROM base AS release
WORKDIR /app/web
# setup migration tool
RUN npm install -g node-pg-migrate
# copy migrations
COPY web/migrations ./migrations
# copy web
COPY --from=web /app/web/.next/standalone .
COPY --from=web /app/web/public ./public
COPY --from=web /app/web/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
