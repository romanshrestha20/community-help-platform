import express from 'express';
import {
  placeBid,
  getBidsForHelpRequest,
  getMyBids,
  updateBid,
  respondToBid,
  deleteBid,
  getBidById
} from '../controllers/bid.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { requireVerifiedUser } from '../middlewares/authorization.middleware.js';

const router = express.Router();

// Protected routes (require login)
router.post('/', authenticateUser, requireVerifiedUser, placeBid);                     // place a bid
router.put('/:bidId', authenticateUser, requireVerifiedUser, updateBid);              // update your bid (pending)
router.patch('/:bidId/respond', authenticateUser, requireVerifiedUser, respondToBid); // requester accepts/rejects bid
router.delete('/:bidId', authenticateUser, requireVerifiedUser, deleteBid);           // delete your pending bid
router.get('/my', authenticateUser, requireVerifiedUser, getMyBids);                  // helper's own bidding activity

router.get('/:bidId', authenticateUser, requireVerifiedUser, getBidById);

router.get('/help-request/:helpRequestId', authenticateUser, requireVerifiedUser, getBidsForHelpRequest); // requester only

export default router;

