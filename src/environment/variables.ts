export const rmqUrl = process.env.RMQ_URL || 'amqp://localhost:5672'; // 'amqp://localhost:5672' if starting on localhost else 'amqp://rabbitmq:5672'
export const port = process.env.APP_PORT || 3200;
export const databaseHost = process.env.DB_HOST || 'localhost'; // 'localhost' if starting on localhost
