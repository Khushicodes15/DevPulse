FROM ubuntu:24.04
WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /root/.local/bin && \
    curl -fsSL -L https://github.com/withcoral/coral/releases/download/v0.2.0/coral-x86_64-unknown-linux-gnu.tar.gz \
    | tar -xz -C /root/.local/bin && \
    chmod +x /root/.local/bin/coral

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/coral-config/workspaces/default/sources/github \
    && mkdir -p /app/coral-config/workspaces/default/sources/linear \
    && mkdir -p /app/coral-config/workspaces/default/sources/sentry

COPY coral-config/config.toml /app/coral-config/config.toml

RUN chmod +x /app/start.sh

ENV CORAL_BIN=/root/.local/bin/coral
ENV CORAL_CONFIG_DIR=/app/coral-config

EXPOSE 3001
CMD ["/app/start.sh"]