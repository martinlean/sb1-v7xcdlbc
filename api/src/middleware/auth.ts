import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { LoggingService, LogLevel, LogCategory } from '../services/logging';

const logger = LoggingService.getInstance();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid token');
    }

    req.user = user;
    next();
  } catch (err) {
    logger.log({
      level: LogLevel.WARN,
      category: LogCategory.SECURITY,
      message: 'Authentication failed',
      metadata: { error: err }
    });

    res.status(401).json({
      error: 'Unauthorized'
    });
  }
};