import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';

const startServer = () => {
  const server = app.listen(env.port, () => {
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
  });

  connectDatabase()
    .then(() => console.log('Base de datos conectada'))
    .catch((error) => console.error('No se pudo conectar a la base de datos:', error.message));

  return server;
};

startServer();
