FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY app/ /usr/src/app/

RUN npm install --silent

RUN npm run build

EXPOSE 8042
CMD [ "node", "server.js" ]
