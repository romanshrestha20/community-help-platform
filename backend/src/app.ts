import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';
import requestRoutes from './routes/request.route.js';
import categoryRoutes from './routes/category.route.js';
import bidRoutes from './routes/bid.route.js';
import notificationRoutes from './routes/notification.route.js';
import conversationRoutes from './routes/conversation.route.js';
import favoriteRoutes from './routes/favorite.route.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, server is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/favorites', favoriteRoutes);


app.use(notFound);
app.use(errorHandler);



export default app;
