import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';
import requestRoutes from './routes/request.route.js';
import bidRoutes from './routes/bid.route.js';

import { errorHandler, notFound } from './middlewares/error.middleware.js';


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, server is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/bids', bidRoutes);


app.use(notFound);
app.use(errorHandler);



export default app;