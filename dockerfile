FROM --platform=linus/amd64 node:lts-alpine

WORKDIR /index

COPY package.json package-lock.json ./

RUN npm install 

COPY . .

EXPOSE 8000

CMD [ "npm", "start" ]