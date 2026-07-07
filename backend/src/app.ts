import express from 'express';

import { HealthController } from './controllers/HealthController.js';
import { ServerController } from './controllers/ServerController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createHealthRoute } from './routes/HealthRoute.js';
import { createServerRoute } from './routes/ServerRoute.js';
import { ConfigService } from './services/ConfigService.js';
import { HealthService } from './services/HealthService.js';
import { ServerReachabilityService } from './services/ServerReachabilityService.js';
import { ServerService } from './services/ServerService.js';
import { WakeOnLanService } from './services/WakeOnLanService.js';

const configService = new ConfigService();
const healthService = new HealthService(configService);
const serverReachabilityService = new ServerReachabilityService();
const wakeOnLanService = new WakeOnLanService();
const serverService = new ServerService(configService, serverReachabilityService, wakeOnLanService);

const healthController = new HealthController(healthService);
const serverController = new ServerController(serverService);

const app = express();

app.use(requestLogger);
app.use(express.json());
app.use('/api', createHealthRoute(healthController));
app.use('/api', createServerRoute(serverController));
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
