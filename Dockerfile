FROM node:18.16.0-alpine3.17
RUN mkdir -p /srv
WORKDIR /srv
VOLUME /srv/images
COPY package.json package-lock.json ./
RUN npm install
COPY src images public ./
EXPOSE 3000
CMD [ "node", "src/index.js"]