import React, { useState, useEffect, useMemo, useRef } from 'react';

// Data generator for stocks and timeframes
const stockBaseData = {
    RELIANCE: { basePrice: 2112.40, name: "Reliance Industries", volumeBase: "4.2M" },
    HDFCBANK: { basePrice: 1522.35, name: "HDFC Bank Ltd.", volumeBase: "6.8M" },
    INFY: { basePrice: 1432.10, name: "Infosys Ltd.", volumeBase: "3.1M" },
    TCS: { basePrice: 3410.80, name: "Tata Consultancy Services", volumeBase: "2.5M" },
    SBIN: { basePrice: 785.40, name: "State Bank of India", volumeBase: "8.5M" },
    BHARTIARTL: { basePrice: 1180.50, name: "Bharti Airtel", volumeBase: "5.1M" },
    ITC: { basePrice: 435.20, name: "ITC Ltd.", volumeBase: "12.3M" },
    WIPRO: { basePrice: 577.75, name: "Wipro Ltd.", volumeBase: "3.9M" }
};

const timeframeConfigs = {
    '1D': { points: 15, volatility: 0.004, labels: ['9:15 AM', '9:45 AM', '10:15 AM', '10:45 AM', '11:15 AM', '11:45 AM', '12:15 PM', '12:45 PM', '1:15 PM', '1:45 PM', '2:15 PM', '2:45 PM', '3:15 PM', '3:30 PM'] },
    '1W': { points: 12, volatility: 0.012, labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    '1M': { points: 16, volatility: 0.025, labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
    '1Y': { points: 20, volatility: 0.06, labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
    'ALL': { points: 24, volatility: 0.12, labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'] }
};

// Generates deterministic price curve based on stock symbol and timeframe
function generateChartPoints(symbol, timeframe) {
    const base = stockBaseData[symbol]?.basePrice || 1000;
    const config = timeframeConfigs[timeframe] || timeframeConfigs['1D'];
    const count = config.points;

    // Seed pseudo-random generator based on symbol + timeframe string
    let seed = 0;
    const seedStr = symbol + timeframe;
    for (let i = 0; i < seedStr.length; i++) {
        seed = (seed << 5) - seed + seedStr.charCodeAt(i);
        seed |= 0;
    }
    const pseudoRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    let current = base * (0.97 + pseudoRandom() * 0.06);
    const points = [];
    const volumes = [];

    for (let i = 0; i < count; i++) {
        const factor = 1 + (pseudoRandom() - 0.48) * config.volatility * 2;
        current = Math.max(10, current * factor);
        points.push(Number(current.toFixed(2)));
        
        // Generate matching volume bar height
        const volVal = Math.floor(30 + pseudoRandom() * 70);
        volumes.push(volVal);
    }
    
    // Ensure final point is close to current base price for realism
    points[points.length - 1] = base;

    return { points, volumes };
}

// Convert points to smooth SVG path curve using cubic bezier control points
function getSmoothPath(coords) {
    if (coords.length < 2) return '';
    
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i === 0 ? i : i - 1];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
}

function LiveChartsShowcase() {
    const [selectedStock, setSelectedStock] = useState('RELIANCE');
    const [timeframe, setTimeframe] = useState('1D');
    const [hoveredData, setHoveredData] = useState(null);
    const [livePriceOffset, setLivePriceOffset] = useState(0);
    const svgRef = useRef(null);

    // Dynamic dataset generation on stock or timeframe change
    const { rawPoints, rawVolumes } = useMemo(() => {
        const { points, volumes } = generateChartPoints(selectedStock, timeframe);
        return { rawPoints: points, rawVolumes: volumes };
    }, [selectedStock, timeframe]);

    // Live tick simulation interval
    useEffect(() => {
        const interval = setInterval(() => {
            const delta = (Math.random() - 0.49) * (stockBaseData[selectedStock].basePrice * 0.0015);
            setLivePriceOffset((prev) => Number((prev + delta).toFixed(2)));
        }, 2500);

        return () => clearInterval(interval);
    }, [selectedStock]);

    // Reset offset when stock changes
    useEffect(() => {
        setLivePriceOffset(0);
    }, [selectedStock, timeframe]);

    // Compute prices with live offset
    const points = useMemo(() => {
        const pts = [...rawPoints];
        pts[pts.length - 1] = Number((pts[pts.length - 1] + livePriceOffset).toFixed(2));
        return pts;
    }, [rawPoints, livePriceOffset]);

    const startPrice = points[0];
    const latestPrice = points[points.length - 1];
    const priceDiff = latestPrice - startPrice;
    const percentChange = ((priceDiff / startPrice) * 100).toFixed(2);
    const isPositive = priceDiff >= 0;

    const dayHigh = Math.max(...points);
    const dayLow = Math.min(...points);
    const themeColor = isPositive ? '#10B981' : '#EF4444';
    const themeBgOpacity = isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';

    // SVG coordinates calculation
    const svgWidth = 800;
    const svgHeight = 200;
    const paddingY = 25;

    const minP = Math.min(...points);
    const maxP = Math.max(...points);
    const rangeP = maxP - minP || 1;

    const coords = useMemo(() => {
        return points.map((p, i) => {
            const x = (i / (points.length - 1)) * svgWidth;
            const y = svgHeight - paddingY - ((p - minP) / rangeP) * (svgHeight - paddingY * 2);
            return { x, y, price: p, index: i };
        });
    }, [points, minP, maxP, rangeP]);

    const linePath = useMemo(() => getSmoothPath(coords), [coords]);
    const areaPath = useMemo(() => {
        if (!coords.length) return '';
        const lastX = coords[coords.length - 1].x;
        const firstX = coords[0].x;
        return `${linePath} L ${lastX} ${svgHeight} L ${firstX} ${svgHeight} Z`;
    }, [linePath, coords]);

    // Handle interactive hover over SVG
    const handleMouseMove = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const relativeX = (mouseX / rect.width) * svgWidth;

        // Find closest point index
        let closestIndex = 0;
        let minDistance = Infinity;

        coords.forEach((c, idx) => {
            const dist = Math.abs(c.x - relativeX);
            if (dist < minDistance) {
                minDistance = dist;
                closestIndex = idx;
            }
        });

        const closestPoint = coords[closestIndex];
        const labelList = timeframeConfigs[timeframe].labels;
        const label = labelList[closestIndex % labelList.length] || `Point ${closestIndex + 1}`;

        setHoveredData({
            x: closestPoint.x,
            y: closestPoint.y,
            price: closestPoint.price,
            label,
            change: (((closestPoint.price - startPrice) / startPrice) * 100).toFixed(2)
        });
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
    };

    const activeDisplayPrice = hoveredData ? hoveredData.price : latestPrice;
    const activeDisplayChange = hoveredData ? hoveredData.change : percentChange;

    return (
        <div className='container py-5 my-4'>
            <div className='card border-0 shadow-sm rounded-4 overflow-hidden' style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                border: "1px solid #E2E8F0"
            }}>
                {/* Chart Header */}
                <div className='p-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3' style={{ background: "#FFFFFF" }}>
                    <div>
                        <div className='d-flex align-items-center gap-2 mb-1'>
                            <h3 className='fw-bold text-dark m-0'>{selectedStock}</h3>
                            <span className={`badge ${Number(activeDisplayChange) >= 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} fw-bold px-2 py-1`}>
                                {Number(activeDisplayChange) >= 0 ? `+${activeDisplayChange}%` : `${activeDisplayChange}%`}
                            </span>
                            <span className='badge bg-light text-secondary border small ms-1'>
                                {stockBaseData[selectedStock].name}
                            </span>
                        </div>
                        <div className='fs-4 fw-bold text-dark d-flex align-items-center gap-2'>
                            ₹{activeDisplayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            {hoveredData && <small className='text-muted fs-6 fw-normal'>({hoveredData.label})</small>}
                        </div>
                    </div>

                    {/* Stock Selector Tabs */}
                    <div className='d-flex gap-1 bg-light p-1 rounded-3 border overflow-auto' style={{ maxWidth: '100%' }}>
                        {Object.keys(stockBaseData).map((symbol) => (
                            <button
                                key={symbol}
                                onClick={() => setSelectedStock(symbol)}
                                className={`btn btn-sm fw-bold px-3 py-1 ${selectedStock === symbol ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary'}`}
                                style={{
                                    borderRadius: "6px",
                                    background: selectedStock === symbol ? "#3B82F6" : "transparent",
                                    border: "none",
                                    transition: "all 0.2s"
                                }}
                            >
                                {symbol}
                            </button>
                        ))}
                    </div>

                    {/* Timeframe Selector */}
                    <div className='d-flex gap-1 bg-light p-1 rounded-3 border'>
                        {['1D', '1W', '1M', '1Y', 'ALL'].map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`btn btn-sm fw-bold px-2 py-1 ${timeframe === tf ? 'btn-dark text-white' : 'btn-light text-muted'}`}
                                style={{
                                    borderRadius: "4px",
                                    fontSize: "0.75rem",
                                    background: timeframe === tf ? "#0F172A" : "transparent",
                                    border: "none"
                                }}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Graph Canvas Area */}
                <div 
                    className='p-4 position-relative style-chart-wrapper'
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        background: "radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.04) 0%, transparent 70%), linear-gradient(to right, rgba(226, 232, 240, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(226, 232, 240, 0.3) 1px, transparent 1px)",
                        backgroundSize: "100% 100%, 30px 30px, 30px 30px",
                        minHeight: "260px",
                        cursor: "crosshair"
                    }}
                >
                    {/* SVG Stock Line Graph */}
                    <svg 
                        ref={svgRef}
                        width="100%" 
                        height="200" 
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                        preserveAspectRatio="none"
                        style={{ overflow: 'visible' }}
                    >
                        <defs>
                            <linearGradient id="dynamicChartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={themeColor} stopOpacity="0.3"/>
                                <stop offset="100%" stopColor={themeColor} stopOpacity="0.0"/>
                            </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        <line x1="0" y1="40" x2="800" y2="40" stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1="0" y1="100" x2="800" y2="100" stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
                        <line x1="0" y1="160" x2="800" y2="160" stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />

                        {/* Area Fill Under Curve */}
                        <path 
                            d={areaPath} 
                            fill="url(#dynamicChartGradient)"
                            style={{ transition: "d 0.4s ease" }}
                        />
                        {/* Main Trend Line */}
                        <path 
                            d={linePath} 
                            fill="none" 
                            stroke={themeColor} 
                            strokeWidth="3.5" 
                            strokeLinecap="round"
                            style={{ transition: "d 0.4s ease, stroke 0.3s ease" }}
                        />

                        {/* Live End Node (when not hovering) */}
                        {!hoveredData && coords.length > 0 && (
                            <g style={{ transition: "transform 0.3s ease" }}>
                                <circle 
                                    cx={coords[coords.length - 1].x} 
                                    cy={coords[coords.length - 1].y} 
                                    r="6" 
                                    fill={themeColor} 
                                />
                                <circle 
                                    cx={coords[coords.length - 1].x} 
                                    cy={coords[coords.length - 1].y} 
                                    r="14" 
                                    fill={themeColor} 
                                    fillOpacity="0.25"
                                >
                                    <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="fill-opacity" values="0.4;0.0;0.4" dur="2s" repeatCount="indefinite" />
                                </circle>
                            </g>
                        )}

                        {/* Interactive Hover Crosshair & Pointer */}
                        {hoveredData && (
                            <g>
                                {/* Vertical Guideline */}
                                <line 
                                    x1={hoveredData.x} 
                                    y1="0" 
                                    x2={hoveredData.x} 
                                    y2={svgHeight} 
                                    stroke="#64748B" 
                                    strokeDasharray="4 4" 
                                    strokeWidth="1.5" 
                                />
                                {/* Horizontal Guideline */}
                                <line 
                                    x1="0" 
                                    y1={hoveredData.y} 
                                    x2={svgWidth} 
                                    y2={hoveredData.y} 
                                    stroke="#64748B" 
                                    strokeDasharray="4 4" 
                                    strokeWidth="1.5" 
                                />
                                {/* Hovered Point Circle */}
                                <circle cx={hoveredData.x} cy={hoveredData.y} r="7" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
                            </g>
                        )}
                    </svg>

                    {/* Volume Histogram Bars */}
                    <div className='d-flex align-items-end justify-content-between px-1 pt-3' style={{ height: "45px", opacity: 0.7 }}>
                        {rawVolumes.map((volHeight, idx) => {
                            const isBarUp = idx === 0 ? true : points[idx] >= points[idx - 1];
                            return (
                                <div 
                                    key={idx}
                                    style={{ 
                                        width: `${80 / rawVolumes.length}%`, 
                                        height: `${volHeight}%`, 
                                        background: isBarUp ? "#10B981" : "#EF4444", 
                                        borderRadius: "2px",
                                        transition: "height 0.3s ease" 
                                    }}
                                    title={`Volume bar ${idx + 1}`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Chart Footer Metrics */}
                <div className='p-3 border-top bg-white d-flex justify-content-around text-center small text-muted flex-wrap gap-2'>
                    <div>Day High: <strong className='text-dark'>₹{dayHigh.toFixed(2)}</strong></div>
                    <div>Day Low: <strong className='text-dark'>₹{dayLow.toFixed(2)}</strong></div>
                    <div>Volume: <strong className='text-dark'>{stockBaseData[selectedStock].volumeBase}</strong></div>
                    <div>Market State: <strong className='text-success'>● LIVE STREAMING</strong></div>
                </div>
            </div>
        </div>
    );
}

export default LiveChartsShowcase;

