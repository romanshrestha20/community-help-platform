import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.route.js';
import requestRoutes from './routes/request.route.js';
import categoryRoutes from './routes/category.route.js';
import bidRoutes from './routes/bid.route.js';
import notificationRoutes from './routes/notification.route.js';
import conversationRoutes from './routes/conversation.route.js';
import favoriteRoutes from './routes/favorite.route.js';
import reviewRoutes from './routes/review.route.js';
import userRoutes from './routes/user.route.js';
import skillRoutes from './routes/skill.route.js';
import adminRoutes from './routes/admin.route.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';


const app = express();
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";
const defaultDevOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:3000",
];
const effectiveOrigins = allowedOrigins.length > 0 ? allowedOrigins : (isProduction ? [] : defaultDevOrigins);
const isOriginAllowed = (origin?: string) =>
  Boolean(origin && effectiveOrigins.includes(origin));

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow server-to-server, mobile native, and curl requests with no Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    // Clean deny for browsers without throwing framework errors.
    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use((req, _res, next) => {
  if (req.method === "OPTIONS") {
    const requestOrigin = req.headers.origin;
    const requestMethod = req.headers["access-control-request-method"];

    console.log("[cors] preflight", {
      path: req.originalUrl,
      origin: requestOrigin || null,
      requestMethod: requestMethod || null,
      allowed: isOriginAllowed(requestOrigin),
    });
  }

  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/admin', adminRoutes);


app.use(notFound);
app.use(errorHandler);



export default app;
