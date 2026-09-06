import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { 
  MarketDataCoordinator, 
  SYMBOL_METADATA 
} from './server/marketDataProvider';
import { MarketSymbol, Timeframe, PriceTick } from './src/types';

// Load environment variables
dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json());

// Initialize Market Data Coordinator (Decouples LIVE and DEMO providers)
const coordinator = new MarketDataCoordinator(process.env.TWELVE_DATA_API_KEY);
coordinator.start();
const provider = coordinator.getProvider();

// Create HTTP Server
const server = http.createServer(app);

// Create WebSocket Server on path /ws/market
const wss = new WebSocketServer({ server, path: '/ws/market' });

// Track client subscriptions
interface ClientSession {
  ws: WebSocket;
  activeSymbol: MarketSymbol;
}
const clients: Map<WebSocket, ClientSession> = new Map();

wss.on('connection', (ws: WebSocket) => {
  const session: ClientSession = {
    ws,
    activeSymbol: 'XAUUSD'
  };
  clients.set(ws, session);

  // Send initial handshake state
  const status = provider.getStatus();
  const m5Countdown = provider.candleBuilder.getM5Countdown(session.activeSymbol);
  ws.send(JSON.stringify({
    type: 'CONNECTION_STATUS',
    data: {
      ...status,
      symbol: session.activeSymbol,
      m5Countdown
    }
  }));

  ws.on('message', (message: WebSocket.Data) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'SUBSCRIBE' && parsed.symbol) {
        session.activeSymbol = parsed.symbol as MarketSymbol;
        provider.subscribe(session.activeSymbol);
        
        // Reply with fresh snapshot for new symbol
        const snapshot = {
          symbol: session.activeSymbol,
          candles: provider.candleBuilder.getMultiTimeframeCandles(session.activeSymbol),
          latestPrice: provider.candleBuilder.getLatestPrice(session.activeSymbol),
          m5Countdown: provider.candleBuilder.getM5Countdown(session.activeSymbol),
          status: provider.getStatus()
        };
        ws.send(JSON.stringify({ type: 'MARKET_SNAPSHOT', data: snapshot }));
      }
    } catch (err) {
      console.error('[WS Client Message Error]', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast real-time price updates to connected WebSocket clients and SSE listeners
provider.onPriceUpdate((tick: PriceTick) => {
  const m5Countdown = provider.candleBuilder.getM5Countdown(tick.symbol);
  const payload = JSON.stringify({
    type: 'PRICE_TICK',
    data: {
      ...tick,
      m5Countdown,
      status: provider.getStatus()
    }
  });

  clients.forEach(session => {
    if (session.ws.readyState === WebSocket.OPEN) {
      // Send if subscribed to this symbol or all symbols
      if (session.activeSymbol === tick.symbol) {
        session.ws.send(payload);
      }
    }
  });

  // Also broadcast to active SSE connections
  broadcastSse(tick.symbol, payload);
});

// SSE Support for robust fallback in sandboxed iframe previews
interface SseClient {
  id: number;
  symbol: MarketSymbol;
  res: express.Response;
}
let nextSseId = 1;
const sseClients: Map<number, SseClient> = new Map();

function broadcastSse(symbol: MarketSymbol, dataJson: string) {
  sseClients.forEach(client => {
    if (client.symbol === symbol) {
      client.res.write(`data: ${dataJson}\n\n`);
    }
  });
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. Provider Status & Configuration
app.get('/api/market/config', (req, res) => {
  const status = provider.getStatus();
  res.json({
    status,
    hasApiKey: Boolean(process.env.TWELVE_DATA_API_KEY),
    symbols: SYMBOL_METADATA
  });
});

// 2. Historical Candles
app.get('/api/market/history', async (req, res) => {
  const symbol = (req.query.symbol as MarketSymbol) || 'XAUUSD';
  const timeframe = (req.query.timeframe as Timeframe) || 'M5';
  const count = parseInt(req.query.count as string, 10) || 250;

  try {
    const candles = await provider.getHistoricalCandles(symbol, timeframe, count);
    res.json({
      symbol,
      timeframe,
      count: candles.length,
      candles
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Multi-Timeframe Snapshot
app.get('/api/market/snapshot', (req, res) => {
  const symbol = (req.query.symbol as MarketSymbol) || 'XAUUSD';
  const multiCandles = provider.candleBuilder.getMultiTimeframeCandles(symbol);
  const latestPrice = provider.candleBuilder.getLatestPrice(symbol);
  const m5Countdown = provider.candleBuilder.getM5Countdown(symbol);
  const status = provider.getStatus();
  const diagnostics = provider.getDiagnostics(symbol);

  res.json({
    symbol,
    latestPrice,
    m5Countdown,
    status,
    diagnostics,
    candles: multiCandles
  });
});

// 4. Live Data Diagnostics Endpoint (Requirement 6)
app.get('/api/market/diagnostics', (req, res) => {
  const symbol = (req.query.symbol as MarketSymbol) || 'XAUUSD';
  const diagnostics = provider.getDiagnostics(symbol);
  res.json(diagnostics);
});

// 5. SSE Stream endpoint for real-time market updates
app.get('/api/market/stream', (req, res) => {
  const symbol = (req.query.symbol as MarketSymbol) || 'XAUUSD';
  const clientId = nextSseId++;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');

  sseClients.set(clientId, { id: clientId, symbol, res });

  // Send initial snapshot
  const initialData = JSON.stringify({
    type: 'INITIAL_SNAPSHOT',
    data: {
      symbol,
      latestPrice: provider.candleBuilder.getLatestPrice(symbol),
      m5Countdown: provider.candleBuilder.getM5Countdown(symbol),
      status: provider.getStatus()
    }
  });
  res.write(`data: ${initialData}\n\n`);

  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// -------------------------------------------------------------
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[TradeXpulse Server] Running on http://0.0.0.0:${PORT}`);
  });
}

initServer().catch(err => {
  console.error('[Server Start Error]', err);
});
