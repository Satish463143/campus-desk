const app = require("./src/config/express.config");
require("dotenv").config();
const { connectRedis } = require("./src/config/redis.config");
const PORT = process.env.PORT || 9000;

(async () => {
  try {
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (e) {
    console.error("❌ Failed to start:", e);
    process.exit(1);
  }
})();

