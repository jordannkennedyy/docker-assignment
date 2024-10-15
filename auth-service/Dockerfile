FROM node:18

WORKDIR /app

COPY . .

RUN npm install
RUN npm install express
RUN npm passport 
RUN npm install passport-local
RUN npm express-session
RUN npm body-parser

EXPOSE 5000

CMD ["node", "app.js"]