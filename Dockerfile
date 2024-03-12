FROM rust:slim AS base
RUN apt update
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
ENV NVM_DIR /root/.nvm
RUN . $NVM_DIR/nvm.sh && nvm install 21.7.1
ENV PATH $NVM_DIR/versions/node/v21.7.1/bin:$PATH
RUN npm install -g yarn

FROM base AS db
WORKDIR /app/db
# Fake cargo
RUN cargo init --lib .
# Build dependencies
COPY db/Cargo* ./
RUN cargo build --release
# Build
COPY db .
RUN yarn
RUN yarn build

FROM base AS web
# Fake db package
WORKDIR /app/db
RUN yarn init -y
# Install packages
WORKDIR /app/web
COPY web/package.json web/yarn.lock web/.yarnrc.yml ./
COPY web/.yarn ./.yarn
RUN yarn
# Copy db package
WORKDIR /app/db
COPY --from=db /app/db/index.d.ts /app/db/index.js /app/db/package.json /app/db/db.*.node ./
COPY --from=db /app/db/target/release/libdb.so ./target/release/libdb.so
COPY --from=db /app/db/target/release/deps/*.so ./target/release/deps/
# Build
WORKDIR /app/web
RUN yarn upgrade db
COPY web .
RUN yarn build

FROM base AS release
# install sqlx-cli
RUN apt install libssl-dev pkg-config -y
RUN cargo install sqlx-cli
# copy migrations
WORKDIR /app/db
COPY db/migrations ./migrations
# copy web
WORKDIR /app/web
COPY --from=web /app/web/.next/standalone .
COPY --from=web /app/web/public ./public
COPY --from=web /app/web/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
