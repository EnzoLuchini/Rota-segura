import {createServer} from './api.js';
const port = Number(process.env.PORT || 3001);
createServer().listen(port,'127.0.0.1',() => console.log(`API Rota Segura em http://127.0.0.1:${port}`));
