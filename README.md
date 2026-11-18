# 🏠 Homesworth
 
**Know the area before you buy the home.**
 
[**homesworth.co.uk**](https://homesworth.co.uk/)
 
Homesworth scores any UK postcode so people can understand a neighbourhood before buying a property. Enter a postcode and get an overall score, plus a breakdown of house prices, crime, commute and nearby amenities, all pulled live from public data.
 
<!-- Add a screenshot or GIF of the results page here, e.g. -->
<!-- ![Homesworth results page](docs/screenshot.png) -->
 
---
 
## ✨ Features
 
- **Overall area score:** a single score ring summarising the postcode
- **House prices:** recent sales from HM Land Registry, with a price trend chart
- **Crime:** recent street-level crime around the postcode
- **Commute & transport:** distance to the nearest city, plus train and tram access
- **Nearby amenities:** the nearest supermarkets, gyms and schools, by name
- **Responsive layout:** a separate mobile view, with amenities collapsed into a single card
## 🛠 Tech stack
 
| Area | Tools |
|---|---|
| Framework | React, Vite |
| Routing | React Router |
| Styling | CSS Modules |
| Charts & icons | Recharts, lucide-react |
| Hosting | Vercel (including a serverless function) |
 
## 🌍 Data sources
 
| Data | Source |
|---|---|
| Postcode lookup | [postcodes.io](https://postcodes.io/) |
| House prices | [HM Land Registry Price Paid Data](https://www.gov.uk/government/collections/price-paid-data) |
| Crime | [Police UK API](https://data.police.uk/docs/) |
| Amenities & transport | [OpenStreetMap](https://www.openstreetmap.org/) via the Overpass API |
 
## 🧱 Engineering highlights
 
- **Reliable amenity data:** public Overpass servers often rate-limit or time out, so amenity requests go through a Vercel serverless proxy first (which keeps the API key on the server) and fall back across other Overpass servers with timeouts. If they all fail, only the amenities section is hidden and the rest of the page still loads.
- **Smarter house price search:** looks up the postcode's own locality in Land Registry data first, then widens to the district, and falls back to postcodes.io's district when a postcode has no sales history.
- **Refactored for maintainability:** the main results page went from ~1,000 lines to ~440 by splitting it into `api/`, `utils/`, `constants/` and reusable components (e.g. a shared `DetailCard`).
## 🚀 Running locally
 
```bash
git clone https://github.com/ashleyBoden/homesworth.git
cd homesworth/postmark
npm install
npm run dev
```
 
The app lives in the `postmark/` folder (the project's original name).
 
> The amenities proxy runs as a Vercel serverless function and needs a `NEXTGIS_KEY` environment variable. Without it, the app falls back to the public Overpass servers.
 
Built by [Ashley Boden](https://github.com/ashleyBoden). Contains HM Land Registry data © Crown copyright, police.uk data under the Open Government Licence, and © OpenStreetMap contributors.
 
