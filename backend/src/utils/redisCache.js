const {redisClient} = require("../config/redis.config");

exports.getCache = async (key) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

exports.setCache = async (key, value, ttl = 600) => {
  await redisClient.setEx(key, ttl, JSON.stringify(value));
};

exports.clearCache = async (pattern) => {
  if (pattern.includes("*")) {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } else {
    await redisClient.del(pattern);
  }
};
