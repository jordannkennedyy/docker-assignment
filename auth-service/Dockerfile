FROM node:18

WORKDIR /app

COPY . .

RUN npm install
RUN npm install express
RUN npm install passport 
RUN npm install passport-local
RUN npm install express-session
RUN npm install body-parser
RUN npm install @kubernetes/client-node

EXPOSE 5000

CMD ["node", "app.js"]