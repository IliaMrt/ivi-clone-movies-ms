export const rmqUrl = process.env.RMQ_URL || 'amqp://localhost:5672'; // 'amqp://localhost:5672' if starting on localhost else 'amqp://rabbitmq:5672'
export const port = process.env.APP_PORT || 3201;
export const databaseHost = process.env.POSTGRES_HOST || 'localhost'; // 'localhost' if starting on localhost
export const databaseUser = process.env.POSTGRES_USER || 'postgres';
export const databasePassword = process.env.POSTGRES_PASSWORD || 123456;
export const databasePort = process.env.POSTGRES_PORT || 5432;
export const databaseName = process.env.POSTGRES_DB || 'moviesdb';