Copy# 1522 Calls Analysis

Analysis and visualization of Italy's anti-violence hotline (1522) call data from 2013 to 2024. Data source: [ISTAT](https://www.istat.it/).

## Content

### Data Processing
- `get_data.ipynb`: Downloads and processes weekly provincial call data
- `geolocate.ipynb`: Adds geographical coordinates using OpenStreetMap
- `analyze.ipynb`: Creates statistical visualizations

### Interactive Visualization
React/D3.js application showing animated weekly calls on Italy's map:
- Animated dots represent call volume by province
- Timeline shows progression from 2013-2024
- Dynamic resizing for different screen sizes

## Setup

```bash
# Install dependencies
pip install pandas numpy matplotlib seaborn requests

# Get the data
jupyter notebook get_data.ipynb

### Author
Marco Dalla Stella, [mailto:m.dallastella@proton.me](m.dallastella@proton.me)