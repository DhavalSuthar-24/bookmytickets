import { createClient } from 'redis';

const redisClient = createClient();
const redisSubscriber = createClient();
const redisPublisher = createClient();

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));

await redisClient.connect();
await redisSubscriber.connect();
await redisPublisher.connect();
console.log('Redis clients connected.');

export { redisClient, redisSubscriber, redisPublisher };
