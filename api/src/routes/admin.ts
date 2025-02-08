import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas as rotas admin requerem autenticação
router.use(authenticate);

// Rotas administrativas
router.get('/stats', (req, res) => {
  res.json({ message: 'Admin stats' });
});

router.get('/users', (req, res) => {
  res.json({ message: 'Admin users list' });
});

router.post('/users/:id/ban', (req, res) => {
  res.json({ message: 'Ban user' });
});

export default router;