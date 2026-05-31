FROM ubuntu:24.04
WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://withcoral.com/install.sh | sh

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/coral-config
COPY coral-config/config.toml /app/coral-config/config.toml

ENV CORAL_BIN=/root/.local/bin/coral
ENV CORAL_CONFIG_DIR=/app/coral-config

EXPOSE 3001
CMD ["node", "index.js"]