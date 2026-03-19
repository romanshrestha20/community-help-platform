import express from 'express';
import {
  getAllHelpRequests,
  createHelpRequest,
  getHelpRequestById,
  deleteHelpRequest,
  updateHelpRequest,
  updateHelpRequestStatus
} from '../controllers/request.controller.js';

import {
  placeBid,
  getBidsForHelpRequest,
  updateBid,
  respondToBid,
  deleteBid
} from '../controllers/bid.controller.js';

import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protected
router.post('/', authenticateUser, createHelpRequest);
router.put('/:id', authenticateUser, updateHelpRequest);
router.delete('/:id', authenticateUser, deleteHelpRequest);
router.patch('/:id/status', authenticateUser, updateHelpRequestStatus);

// Public
router.get('/', getAllHelpRequests);
router.get('/:id', authenticateUser, getHelpRequestById);

export default router;