FROM alpine:latest

RUN apk add --update nodejs nodejs-npm
RUN apk add -U gpgme 

WORKDIR /usr/src/app
COPY . .

# RUN gpg --version

# RUN ./scripts/setup.sh

# RUN npm install
# RUN npm run test

# ENTRYPOINT ["./scripts/setup.sh"]