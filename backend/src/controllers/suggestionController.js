import { createSuggestion } from '../services/suggestionService.js';

export async function suggestionHandler(req, res, next) {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      res.status(400).json({ message: 'prompt is required' });
      return;
    }
    const suggestion = await createSuggestion({ prompt, context });
    res.json(suggestion);
  } catch (error) {
    next(error);
  }
}
