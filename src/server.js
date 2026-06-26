import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';

const startServer = async () => {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});
