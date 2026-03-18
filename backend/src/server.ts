import app from './app.js';
import { prisma } from './lib/prisma.js';



(async () => {
  try{
    await prisma.$connect();
    console.log('Connected to the database successfully!');
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);

  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});