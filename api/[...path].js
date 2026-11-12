import {createServer} from '../server/api.js';

// Reuse the same request handler without opening a listening socket.
const server = createServer();
export default server.listeners('request')[0];
