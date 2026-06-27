FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . ./
RUN mkdir -p uploads && chown node:node uploads

EXPOSE 8080

USER node

CMD ["npm", "start"]
