FROM node:18

WORKDIR /app

COPY . .

RUN npm install
RUN npm install express
RUN npm install pug
RUN npm install mysql2
RUN npm install aws-sdk
RUN npm install body-parser

EXPOSE 2000

CMD ["node", "app.js"]