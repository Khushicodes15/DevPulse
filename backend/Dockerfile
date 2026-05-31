FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN chmod +x ./coral-bin
ENV CORAL_BIN=/app/coral-bin
ENV CORAL_CONFIG_DIR=/app/coral-config
EXPOSE 3001
CMD ["node", "index.js"]
