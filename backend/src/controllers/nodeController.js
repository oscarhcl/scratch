import {
  createNode,
  deleteNode,
  expandNode,
  getNodeById,
  listGraph,
  traverseGraph,
  updateNode
} from '../services/graphService.js';

export async function listGraphHandler(req, res, next) {
  try {
    const { limit } = req.query;
    const graph = await listGraph(limit ? Number(limit) : undefined);
    res.json(graph);
  } catch (error) {
    next(error);
  }
}

export async function createNodeHandler(req, res, next) {
  try {
    const node = await createNode(req.body);
    res.status(201).json(node);
  } catch (error) {
    next(error);
  }
}

export async function getNodeHandler(req, res, next) {
  try {
    const node = await getNodeById(req.params.id);
    if (!node) {
      res.status(404).json({ message: 'Node not found' });
      return;
    }
    res.json(node);
  } catch (error) {
    next(error);
  }
}

export async function updateNodeHandler(req, res, next) {
  try {
    const node = await updateNode(req.params.id, req.body.properties ?? {});
    if (!node) {
      res.status(404).json({ message: 'Node not found' });
      return;
    }
    res.json(node);
  } catch (error) {
    next(error);
  }
}

export async function deleteNodeHandler(req, res, next) {
  try {
    const deletedId = await deleteNode(req.params.id);
    if (!deletedId) {
      res.status(404).json({ message: 'Node not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function expandNodeHandler(req, res, next) {
  try {
    const { previewOnly = false } = req.body ?? {};
    const result = await expandNode(req.params.id);
    if (!result) {
      res.status(404).json({ message: 'Node not found' });
      return;
    }
    res.json({ ...result, previewOnly });
  } catch (error) {
    next(error);
  }
}

export async function traverseGraphHandler(req, res, next) {
  try {
    const { startId, depth = 2 } = req.body;
    if (!startId) {
      res.status(400).json({ message: 'startId is required' });
      return;
    }
    const traversal = await traverseGraph(startId, depth);
    res.json(traversal);
  } catch (error) {
    next(error);
  }
}
