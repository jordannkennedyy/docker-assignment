FROM node:18

WORKDIR /app

COPY . .

RUN npm install
RUN npm install @kubernetes/client-node

EXPOSE 3000

CMD ["node", "app.js"]