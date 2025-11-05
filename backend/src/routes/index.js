import { Router } from 'express';
import {
  createNodeHandler,
  deleteNodeHandler,
  expandNodeHandler,
  getNodeHandler,
  listGraphHandler,
  traverseGraphHandler,
  updateNodeHandler
} from '../controllers/nodeController.js';
import { suggestionHandler } from '../controllers/suggestionController.js';

const router = Router();

router.get('/graph', listGraphHandler);
router.post('/nodes', createNodeHandler);
router.get('/nodes/:id', getNodeHandler);
router.patch('/nodes/:id', updateNodeHandler);
router.delete('/nodes/:id', deleteNodeHandler);
router.post('/nodes/:id/expand', expandNodeHandler);
router.post('/graph/traverse', traverseGraphHandler);
router.post('/suggestions', suggestionHandler);

export default router;
