FROM node
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install --production=true && yarn cache clear
COPY . .
ENV MYSQL_HOST=database
ENV MYSQL_DATABASE=KDECOLE
ENV MYSQL_USERNAME=root
ENV MYSQL_PASSWORD=root
CMD [ "node", "index.js" ]
