import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"], // Allow both ports
        methods: ["GET", "POST"]
    }
});

// Cache for historical data
const historicalDataCache = new Map();

// Function to fetch historical data
async function fetchHistoricalData(symbol) {
    try {
        // If data is in cache and less than 5 minutes old, return it
        if (historicalDataCache.has(symbol)) {
            const { data, timestamp } = historicalDataCache.get(symbol);
            if (Date.now() - timestamp < 5 * 60 * 1000) {
                return data;
            }
        }

        // Fetch from Django backend
        const response = await axios.get(`http://127.0.0.1:8000/api/stocks/historical/${symbol}`);
        const historicalData = response.data.map(item => ({
            timestamp: item.datetime * 1000, // Convert to milliseconds
            open: item.open_price,
            close: item.close_price,
            high: item.high_price,
            low: item.low_price,
            volume: item.volume
        }));
        
        // Cache the data
        historicalDataCache.set(symbol, {
            data: historicalData,
            timestamp: Date.now()
        });

        return historicalData;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return [];
    }
}

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('getHistoricalData', async ({ symbol }) => {
        const historicalData = await fetchHistoricalData(symbol);
        socket.emit('historicalData', historicalData);

        // Start sending real-time updates
        const interval = setInterval(async () => {
            try {
                // Fetch latest data from Django backend
                const response = await axios.get(`http://127.0.0.1:8000/api/stocks/latest/${symbol}`);
                const latestData = response.data;

                socket.emit('priceUpdate', {
                    timestamp: latestData.datetime * 1000,
                    price: latestData.close_price,
                    volume: latestData.volume
                });
            } catch (error) {
                console.error('Error fetching real-time data:', error);
            }
        }, 60000); // Update every minute

        // Clean up on disconnect
        socket.on('disconnect', () => {
            clearInterval(interval);
        });
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Stock WebSocket server running on port ${PORT}`);
}); 