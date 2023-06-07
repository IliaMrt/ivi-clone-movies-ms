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
- Node.js, npm
- PostgreSQL

## Installation

```bash
$ npm install
```

> Note: If you downloaded this repo from main repo script, there is no need to run install command.

## Setting up & running service

### For localhost

1. Create database named **movies** using Postgres.
2. Set up **.dev.env** file.
3. Run service!

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

```
## Author
[Ilia Martens](https://github.com/IliaMrt/ivi-clone-movies-ms)