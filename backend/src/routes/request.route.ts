import express from 'express';
import {
  getAllHelpRequests,
  createHelpRequest,
  getHelpRequestById,
  deleteHelpRequest,
  updateHelpRequest,
  updateHelpRequestStatus
} from '../controllers/request.controller.js';


import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public
router.get('/', getAllHelpRequests);
router.get('/:id', authenticateUser, getHelpRequestById);

// Protected
router.use(authenticateUser);
router.post('/', createHelpRequest);
router.put('/:id', updateHelpRequest);
router.delete('/:id', deleteHelpRequest);
router.patch('/:id/status', updateHelpRequestStatus);


export default router;