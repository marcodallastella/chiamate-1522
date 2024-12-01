function CallsMap() {
    // Animation timing configuration (all values in milliseconds)
    const ANIMATION_CONFIG = {
        // Time for dots to appear and grow to full size
        GROW_DURATION: 1500,

        // Time dots stay visible at full opacity
        VISIBLE_DURATION: 20,

        // Time for dots to fade out
        FADE_DURATION: 800,

        // Interval between new weeks of data
        // Should be less than total animation duration for overlap
        // (GROW + VISIBLE + FADE = 2800ms total)
        WEEK_INTERVAL: 800,

        // Visual settings
        DOT_OPACITY: {
            INITIAL: 0.5,   // Starting opacity of dots
            PEAK: 0.8,      // Maximum opacity when fully visible
            END: 0          // Final opacity (0 for complete fade)
        },

        DOT_SIZE: {
            MIN: 4,         // Minimum dot radius
            MAX: 18         // Maximum dot radius
        },

        // How many previous week groups to keep before removal
        // Higher number = more potential overlap but more DOM elements
        WEEKS_TO_KEEP: 3
    };

    const startYear = 2013;
    const svgRef = React.useRef(null);
    const [currentData, setCurrentData] = React.useState([]);
    const [currentWeek, setCurrentWeek] = React.useState(0);
    const [italyGeoData, setItalyGeoData] = React.useState(null);
    const animationRef = React.useRef(null);
    const mapInitialized = React.useRef(false);

    const italianMonths = {
        '01': 'Gennaio', '02': 'Febbraio', '03': 'Marzo',
        '04': 'Aprile', '05': 'Maggio', '06': 'Giugno',
        '07': 'Luglio', '08': 'Agosto', '09': 'Settembre',
        '10': 'Ottobre', '11': 'Novembre', '12': 'Dicembre'
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${year} ${italianMonths[month]}`;
    };

    const startAnimation = React.useCallback(() => {
        if (animationRef.current) {
            clearInterval(animationRef.current);
        }

        animationRef.current = setInterval(() => {
            setCurrentWeek(prev => {
                if (prev >= currentData.length - 1) {
                    clearInterval(animationRef.current);
                    // Don't reset to 0, just stay at the last week
                    return prev;
                }
                return prev + 1;
            });
        }, ANIMATION_CONFIG.WEEK_INTERVAL);
    }, [currentData.length]);

    // Initialize map only once
    React.useEffect(() => {
        if (!italyGeoData || !svgRef.current || mapInitialized.current) return;

        const svg = d3.select(svgRef.current);
        const width = 1200;
        const height = 800;

        const projection = d3.geoMercator()
            .fitSize([width, height], italyGeoData);

        const path = d3.geoPath().projection(projection);

        // Draw Italy map once
        svg.append('g')
            .attr('class', 'italy-map')
            .selectAll('path')
            .data(italyGeoData.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', '#808080')
            .attr('stroke', '#696969')
            .attr('stroke-width', '0.5');

        // Create a single group for dots that we'll reuse
        svg.append('g')
            .attr('class', 'dots-container');

        mapInitialized.current = true;
    }, [italyGeoData]);

    // Load data
    React.useEffect(() => {
        Promise.all([
            d3.csv('/data/calls_latlon.csv'),
            d3.json('/data/italy.json')
        ]).then(([callsData, geoData]) => {
            setItalyGeoData(geoData);

            const filteredData = callsData.filter(d => {
                const year = new Date(d.date).getFullYear();
                return year >= startYear;
            });

            const groupedData = d3.group(filteredData, d => d.date);
            setCurrentData(Array.from(groupedData));
            startAnimation();
        });
    }, [startAnimation]);

    // Update dots
    React.useEffect(() => {
        if (!currentData.length || !italyGeoData || !mapInitialized.current) return;

        const svg = d3.select(svgRef.current);
        const projection = d3.geoMercator()
            .fitSize([1200, 800], italyGeoData);

        const weekData = currentData[currentWeek] && currentData[currentWeek][1] ? currentData[currentWeek][1] : [];

        const sizeScale = d3.scaleLinear()
            .domain([0, d3.max(weekData, d => +d.calls)])
            .range([ANIMATION_CONFIG.DOT_SIZE.MIN, ANIMATION_CONFIG.DOT_SIZE.MAX]);

        // Add a unique identifier for each week's dots
        const weekGroup = svg.select('.dots-container')
            .append('g')
            .attr('class', `week-${currentWeek}`);

        // Add new dots for this week
        weekGroup.selectAll('circle')
            .data(weekData)
            .enter()
            .append('circle')
            .attr('cx', d => projection([+d.longitude, +d.latitude])[0])
            .attr('cy', d => projection([+d.longitude, +d.latitude])[1])
            .attr('r', 0)
            .attr('fill', `rgba(223, 32, 32, ${ANIMATION_CONFIG.DOT_OPACITY.INITIAL})`)

            .transition()
            .duration(ANIMATION_CONFIG.GROW_DURATION)
            .style('opacity', ANIMATION_CONFIG.DOT_OPACITY.PEAK)
            .attr('r', d => sizeScale(+d.calls))
            .transition()
            .duration(ANIMATION_CONFIG.VISIBLE_DURATION)
            .style('opacity', ANIMATION_CONFIG.DOT_OPACITY.PEAK)
            .transition()
            .duration(ANIMATION_CONFIG.FADE_DURATION)
            .style('opacity', ANIMATION_CONFIG.DOT_OPACITY.END)
            .end()
            .then(() => {
                weekGroup.remove();
            });

        // Only remove groups that are definitely done
        const oldWeek = currentWeek - ANIMATION_CONFIG.WEEKS_TO_KEEP;
        if (oldWeek >= 0) {
            svg.select(`.week-${oldWeek}`).remove();
        }
    }, [currentData, currentWeek, italyGeoData]);

    return (
        <div className="map-container">
            <div className="info-panel">
                <h3>
                    {currentData[currentWeek] ? (
                        <React.Fragment>
                            {formatDate(currentData[currentWeek][0]).split(' ')[0]}<br />
                            {formatDate(currentData[currentWeek][0]).split(' ')[1]}
                        </React.Fragment>
                    ) : ''}
                </h3>
                <p> {
                    currentData[currentWeek] && currentData[currentWeek][1]
                        ? currentData[currentWeek][1].reduce((sum, d) => sum + Number(d.calls), 0)
                        : 0
                }</p>
            </div>
            <svg ref={svgRef} width={1200} height={800}>
            </svg>
        </div>
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CallsMap />);