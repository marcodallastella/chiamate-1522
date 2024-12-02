const baseUrl = location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? ''
    : '/chiamate-1522';

function CallsMap() {
    const svgRef = React.useRef(null);
    const [svgWidth, setSvgWidth] = React.useState(1200);
    const [svgHeight, setSvgHeight] = React.useState(800);

    React.useEffect(() => {
        const updateDimensions = () => {
            if (svgRef.current) {
                const container = svgRef.current.parentElement;
                setSvgWidth(container.clientWidth);
                setSvgHeight(container.clientHeight);
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const ANIMATION_CONFIG = {
        GROW_DURATION: 1500,
        VISIBLE_DURATION: 20,
        FADE_DURATION: 800,
        WEEK_INTERVAL: 800,
        DOT_OPACITY: {
            INITIAL: 0.5,
            PEAK: 0.8,
            END: 0
        },
        DOT_SIZE: {
            MIN: 4,
            MAX: 18
        },
        WEEKS_TO_KEEP: 3
    };

    const startYear = 2023;
    const [currentData, setCurrentData] = React.useState([]);
    const [currentWeek, setCurrentWeek] = React.useState(0);
    const [italyGeoData, setItalyGeoData] = React.useState(null);
    const animationRef = React.useRef(null);
    const mapInitialized = React.useRef(false);

    const getProjection = React.useCallback((width, height) => {
        const scale = Math.min(width, height) * 3.5;
        return d3.geoMercator()
            .center([12.5, 42])
            .scale(scale)
            .translate([width / 2, height / 2]);
    }, []);
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
                    return prev;
                }
                return prev + 1;
            });
        }, ANIMATION_CONFIG.WEEK_INTERVAL);
    }, [currentData.length]);

    // Initialize map 
    React.useEffect(() => {
        if (!italyGeoData || !svgRef.current || mapInitialized.current) return;
    
        const svg = d3.select(svgRef.current);
        
        // Create map group first (so it's behind)
        svg.append('g')
            .attr('class', 'italy-map');
            
        // Create dots group second (so it's on top)
        svg.append('g')
            .attr('class', 'dots-container');
    
        mapInitialized.current = true;
    }, [italyGeoData]);

    // Map updates
    React.useEffect(() => {
        if (!italyGeoData || !svgRef.current || !mapInitialized.current) return;

        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        const projection = getProjection(width, height);
        const path = d3.geoPath().projection(projection);

        svg.select('.italy-map')
            .selectAll('path')
            .data(italyGeoData.features)
            .join('path')
            .attr('d', path)
            .attr('fill', '#333333')
            .attr('stroke', '#696969')
            .attr('stroke-width', '0.3');

    }, [italyGeoData, svgWidth, svgHeight, getProjection]);

    // Load data
    React.useEffect(() => {
        Promise.all([
            d3.csv(`${baseUrl}/data/calls_latlon.csv`),
            d3.json(`${baseUrl}/data/italy.json`)
        ]).then(([callsData, geoData]) => {
            setItalyGeoData(geoData);

            const filteredData = callsData.filter(d => {
                const year = new Date(d.date).getFullYear();
                return year >= startYear;
            });

            const groupedData = d3.group(filteredData, d => d.date);
            setCurrentData(Array.from(groupedData));
            startAnimation();
        }).catch(error => {
            console.error("Error loading data:", error);
            console.log("Current baseUrl:", baseUrl);
            console.log("Current hostname:", location.hostname);
        });
    }, [startAnimation]);

    // Update dots
    React.useEffect(() => {
        if (!currentData.length || !italyGeoData || !mapInitialized.current) return;

        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        const projection = getProjection(width, height);

        const weekData = currentData[currentWeek] && currentData[currentWeek][1] ? currentData[currentWeek][1] : [];

        const sizeScale = d3.scaleLinear()
            .domain([0, d3.max(weekData, d => +d.calls)])
            .range([ANIMATION_CONFIG.DOT_SIZE.MIN, ANIMATION_CONFIG.DOT_SIZE.MAX]);

        const weekGroup = svg.select('.dots-container')
            .append('g')
            .attr('class', `week-${currentWeek}`);

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

        const oldWeek = currentWeek - ANIMATION_CONFIG.WEEKS_TO_KEEP;
        if (oldWeek >= 0) {
            svg.select(`.week-${oldWeek}`).remove();
        }
    }, [currentData, currentWeek, italyGeoData, getProjection]);

    return (
        <div className="map-container">
            <div className="info-panel">
                {currentData[currentWeek] ? (
                    <React.Fragment>
                        <div className="year">
                            {formatDate(currentData[currentWeek][0]).split(' ')[0]}
                        </div>
                        <div className="month">
                            {formatDate(currentData[currentWeek][0]).split(' ')[1]}
                        </div>
                    </React.Fragment>
                ) : ''}
                <p className="calls-count"> {
                    currentData[currentWeek] && currentData[currentWeek][1]
                        ? currentData[currentWeek][1].reduce((sum, d) => sum + Number(d.calls), 0)
                        : 0
                }</p>
            </div>
            <svg ref={svgRef} width={svgWidth} height={svgHeight}>
            </svg>
            <div className="caption">
                Weekly calls from victims to 1522, number against gender-based violence and stalking.
                <div className="source">Visit the <a href="https://github.com/marcodallastella/chiamate-1522">GitHub repository</a></div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CallsMap />);