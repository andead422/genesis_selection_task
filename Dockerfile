FROM node:12

WORKDIR .

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "btc_to_uah.js" ]
