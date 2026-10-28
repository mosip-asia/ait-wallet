FROM node:20-bookworm-slim
WORKDIR /issuer
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.mjs rsa-suite.mjs ./
ENV ISSUER_STATE_DIR=/state
USER node
CMD ["node", "server.mjs"]
