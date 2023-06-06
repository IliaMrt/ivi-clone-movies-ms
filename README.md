# Movies Microservice for [Ivi Clone backend](https://github.com/IliaMrt/ivi-clone-movies-ms)

<p align="center">
  <a target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>


## Description

This microservice is an API Gateway for [Ivi Clone backend application](https://github.com/IliaMrt/ivi-clone-movies-ms).\
This is the only one microservice for ivi-clone project.\
Here you can find an instructions for setting up and running microservice.

If you found this repo before exploring the [main repo](https://github.com/srgklmv/ivi-clone-repo),
I recommend you to explore [main repo](https://github.com/srgklmv/ivi-clone-repo/.gitignore) firstly for understanding how to run the application.

## Requirements
- RabbitMQ
- Node.js
- PostgreSQL

## Installation

```bash
$ npm install
```

> Note: If you downloaded this repo from main repo script, there is no need to run install command.

## Setting up & running service

### General part (for either localhost & Docker launches)

1. Set up **.dev.env** file for localhost.
   Choose port as you need to access the application. Then change _API_URL_ & _CLIENT_URL_.
   _API_URL_ is a http link to access Gateway, and _CLIENT_URL_ is for client application.
   This links provides correct OAuth work.\
   Set up JWT secret key. It must be same as in Auth Service.\
   If using Docker, change **.dev.env**. Do not change port. Instead of it, change accessible port via Docker.\
   _API_URL_ & _CLIENT_URL_ also must be changed.
2. For loading databases with parsed existing movies you need to create new folder named
   '**movies**', so you will have path to it as:
   '**/ivi-clone-api-gateway/static/movies/**'. Now you need to download [this](https://github.com/JcJet/kinopoisk_nodejs/blob/557726d73af7dd81b79b7630816cffb5bdb0a3db/movies_json.zip) archive
   and extract all .json files into created folder. So now, when you start application, you will be able to run
   '_/loadDatabases1337_' endpoint to load Genres, Movies & Persons databases with real movies & actors.
   \

Now you are able to start Gateway.

>Note: You can access the list of all accessible endpoints using '**/api**' endpoint.

### For localhost
```bash
# watch mode
$ npm run start:dev
```

### For Docker
> There is no need to set up service for using in Docker. You can continue follow main repo instructions.


## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Author
[Ilia Martens](https://github.com/IliaMrt/ivi-clone-movies-ms)