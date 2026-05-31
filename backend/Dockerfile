FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://withcoral.com/install.sh | sh
COPY package*.json ./
RUN npm install --production
COPY . .
ENV CORAL_BIN=/root/.local/bin/coral
ENV CORAL_CONFIG_DIR=/app/coral-config
EXPOSE 3001
CMD ["node", "index.js"]
