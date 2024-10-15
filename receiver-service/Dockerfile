FROM node:18

WORKDIR /app

COPY . .

RUN npm install

# Create the uploads directory
RUN mkdir -p uploads

EXPOSE 4000

CMD ["node", "receiver.js"]