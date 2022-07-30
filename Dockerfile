FROM node:12

WORKDIR .

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 8080
EXPOSE 8090

CMD [ "node", "btc_to_uah.js" ]