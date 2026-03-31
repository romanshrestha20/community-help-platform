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

const router = express.Router();

// Protected routes (require login)
router.post('/', authenticateUser, placeBid);                     // place a bid
router.put('/:bidId', authenticateUser, updateBid);              // update your bid (pending)
router.patch('/:bidId/respond', authenticateUser, respondToBid); // requester accepts/rejects bid
router.delete('/:bidId', authenticateUser, deleteBid);           // delete your pending bid
router.get('/my', authenticateUser, getMyBids);                  // helper's own bidding activity

router.get('/:bidId', authenticateUser, getBidById);

router.get('/help-request/:helpRequestId', authenticateUser, getBidsForHelpRequest); // requester or bidder only

export default router;


