/** Health-check route: a cheap liveness probe used by the frontend and ops. */
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
