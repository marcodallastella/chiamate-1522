# 1522 Calls

Analysis and visualization of Italy's anti-violence hotline (1522) call data from 2013 to 2024. Data source: [ISTAT](hhttps://www.istat.it/statistiche-per-temi/focus/violenza-sulle-donne/la-fuoriuscita-dalla-violenza/numero-di-pubblica-utilita-1522/).

## Content

### Notebooks
- `1_get_data.ipynb`: Downloads and processes weekly provincial call data
- `2_clean_data.ipynb`: Fixes some names (ex. Bolzano/Bozen turned into Bolzano) and adds last day of the corresponding week.
- `3_geolocate.ipynb`: Adds geographical coordinates using OpenStreetMap
- `4_analysis.ipynb`: Filters and group data by year and by week.

### Raw Data
- `dati_provinciali_settimanali.xlsx`: file downloaded from the [ISTAT website](https://www.istat.it/notizia/il-numero-di-pubblica-utilita-1522-anni-2013-2024/)
- `calls_raw.csv`: csv file obtained from the conversion of the excel file. columns are `year`, `week`, `provincia`, `calls`. Unknown location of caller is registered either as `Z`,`missing` or `NaN`.

### Processed Data
- `calls_clean.csv`: processed calls with names cleaned (ex. `Bolzano/Bozen` turned into `Bolzano`), fixed inconsistencines in unknown caller location (now all unknown locations are defined as `missing`).
- `calls_latlon.csv`: clean calls with latlon coordinates.
- `calls_by_year.csv`: total of calls by year
- `calls_by_month.csv`: a pivoted file with week numbers as columns

### Interactive Visualization [LINK](https://marcodallastella.github.io/chiamate-1522/)
React/D3.js application showing animated weekly calls on Italy's map:
- Animated dots represent call volume by province
- Timeline shows progression from 2013-2024
- Dynamic resizing for different screen sizes

**N.B. due to inconsistencies in the data the visualization now displays numbers that are not entirely correct in the totals. Hopefully I'll fix it soon.**


### Author
Marco Dalla Stella, [mailto:m.dallastella@proton.me](m.dallastella@proton.me)
