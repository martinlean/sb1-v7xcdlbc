import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { LoggingService, LogLevel, LogCategory } from './services/logging';

const app = express();
const logger = LoggingService.getInstance();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://checkout.rewardsmidia.online',
    'https://admin.rewardsmidia.online',
    'https://app.rewardsmidia.online'
  ]
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/v1/payments', require('./routes/v1/payments'));
app.use('/v1/products', require('./routes/v1/products'));
app.use('/webhooks', require('./routes/webhooks'));
app.use('/admin', require('./routes/admin'));

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.log({
    level: LogLevel.ERROR,
    category: LogCategory.INTEGRATION,
    message: err.message,
    metadata: {
      stack: err.stack,
      path: req.path,
      method: req.method
    }
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;