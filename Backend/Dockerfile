FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY . .

# Run as non-root user
USER node

EXPOSE 3000

CMD ["node", "index.js"]

