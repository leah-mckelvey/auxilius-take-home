import { createRealtimeServer } from './realtime-server';

const port = Number(process.env.PORT ?? 3000);
const { httpServer } = createRealtimeServer();

httpServer.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
