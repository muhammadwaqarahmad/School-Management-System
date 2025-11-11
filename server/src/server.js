import app from "./app.js";
import dotenv from "dotenv";
import { startMonthlyFeeScheduler } from "./services/monthlyGenerationService.js";
import logger from "./config/logger.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  // Start the monthly fee scheduler
  startMonthlyFeeScheduler();
});
