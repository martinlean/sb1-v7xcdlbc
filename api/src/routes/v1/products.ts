import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Rotas protegidas por autenticação
router.use(authenticate);

// Rotas de produtos
router.get('/', (req, res) => {
  res.json({ message: 'List products' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create product' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get product' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update product' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete product' });
});

export default router;