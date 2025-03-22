import React, { useEffect, useState } from 'react';
import { Stock } from '@ant-design/charts';
import io from 'socket.io-client';
import moment from 'moment';

const StockChart = ({ symbol }) => {
    const [data, setData] = useState([]);
    const [socket, setSocket] = useState(null);
    const [connectionError, setConnectionError] = useState(null);

    useEffect(() => {
        // Connect to WebSocket server
        const newSocket = io('http://localhost:5001', {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server');
            setConnectionError(null);
            // Request historical data when connected
            newSocket.emit('getHistoricalData', { symbol });
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setConnectionError('Failed to connect to server. Please try again later.');
        });

        setSocket(newSocket);

        // Listen for historical data
        newSocket.on('historicalData', (historicalData) => {
            if (!Array.isArray(historicalData)) {
                console.error('Invalid historical data format:', historicalData);
                return;
            }

            const formattedData = historicalData.map(item => ({
                time: moment(item.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                open: item.open,
                close: item.close,
                high: item.high,
                low: item.low,
                volume: item.volume
            }));
            setData(formattedData);
        });

        // Listen for real-time updates
        newSocket.on('priceUpdate', (update) => {
            if (!update || !update.timestamp || !update.price) {
                console.error('Invalid price update format:', update);
                return;
            }

            setData(prevData => {
                const newData = [...prevData];
                const lastIndex = newData.length - 1;
                
                if (!newData.length) {
                    return [{
                        time: moment(update.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                        open: update.price,
                        close: update.price,
                        high: update.price,
                        low: update.price,
                        volume: update.volume || 0
                    }];
                }
                
                // Update the last candle if it's in the same minute
                if (moment(update.timestamp).isSame(moment(newData[lastIndex]?.time), 'minute')) {
                    newData[lastIndex] = {
                        time: moment(update.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                        open: newData[lastIndex].open,
                        close: update.price,
                        high: Math.max(newData[lastIndex].high, update.price),
                        low: Math.min(newData[lastIndex].low, update.price),
                        volume: newData[lastIndex].volume + (update.volume || 0)
                    };
                } else {
                    // Create a new candle
                    newData.push({
                        time: moment(update.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                        open: update.price,
                        close: update.price,
                        high: update.price,
                        low: update.price,
                        volume: update.volume || 0
                    });
                }
                return newData;
            });
        });

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [symbol]);

    const config = {
        data,
        xField: 'time',
        yField: ['open', 'close', 'high', 'low'],
        tooltip: {
            showTitle: true,
            showMarkers: false,
            fields: ['time', 'open', 'close', 'high', 'low', 'volume'],
            formatter: (datum) => {
                return {
                    name: datum.time,
                    value: `Open: ${datum.open}\nClose: ${datum.close}\nHigh: ${datum.high}\nLow: ${datum.low}\nVolume: ${datum.volume}`
                };
            }
        },
        slider: {
            start: 0.7,
            end: 1
        }
    };

    if (connectionError) {
        return (
            <div className="stock-chart-container">
                <h2>{symbol} Price Chart</h2>
                <div className="error-message">{connectionError}</div>
            </div>
        );
    }

    return (
        <div className="stock-chart-container">
            <h2>{symbol} Price Chart</h2>
            {data.length > 0 ? (
                <Stock {...config} />
            ) : (
                <div className="loading-message">Loading chart data...</div>
            )}
        </div>
    );
};

export default StockChart; 