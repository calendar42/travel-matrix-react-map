FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY app/ /usr/src/app/

RUN npm install --silent

EXPOSE 3000
CMD [ "npm", "start" ]
