# Atmos Weather

Atmos Weather is a responsive weather dashboard with a liquid-glass interface inspired by modern desktop operating systems. It retrieves live weather data from Visual Crossing, selects an atmospheric condition, and loads a matching background image from Pexels through the backend.

## Features

- Live weather search by city
- Liquid-glass dashboard with transparent panels and background imagery
- Light and dark themes with local persistence
- Sunny, cloudy, rainy, snowy, and foggy visual states
- Animated rain and drifting clouds
- Wind-driven tree movement for wind speeds at or above 20 km/h
- Responsive desktop and mobile layouts
- Reduced-motion support for accessibility
- API keys kept on the backend
- Environment-based port and CORS configuration

## Project Structure

```text
Sample API call project/
├── frontend/
│   ├── index.html             # Dashboard markup
│   ├── style.css              # Glass UI, themes, and animations
│   ├── script.js               # Search, API calls, and visual state logic
│   ├── config.js               # Local API URL; ignored by Git
│   └── config.example.js       # Production URL template
├── backend/
│   ├── server.js               # Express API server
│   ├── .env                    # Local secrets; ignored by Git
│   ├── .env.example            # Environment variable template
│   ├── package.json             # Backend scripts and dependencies
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Frontend Design

The frontend is a plain HTML, CSS, and JavaScript application, so it does not require a frontend build step.

The page is organized into three visual layers:

1. The atmospheric background contains the fetched Pexels image, gradient lighting, sun, moon, clouds, rain, and landscape.
2. The glass shell contains the sidebar and main dashboard. Transparent backgrounds, borders, blur, and inset highlights create the liquid-glass effect.
3. The dashboard displays the city, temperature, condition, humidity, wind speed, sky status, theme switch, and image credit.

When weather data arrives, `script.js` converts the provider description into a visual condition:

- `Clear` or `Sun` -> sunny
- `Rain`, `Drizzle`, or `Shower` -> rain
- `Snow` or `Ice` -> snow
- `Fog`, `Mist`, or `Haze` -> fog
- Other conditions -> clouds

The condition is stored as a `data-condition` attribute on the main application element. CSS uses that attribute to activate the appropriate scene. Wind speed controls tree opacity, sway angle, and animation speed.

The theme switch stores `light` or `dark` in `localStorage` under `atmos-theme`, so the choice remains after a page reload.

## Backend Functions

The backend is an Express server located in `backend/server.js`.

### `GET /weather?city={city}`

Retrieves current weather from Visual Crossing.

Example request:

```text
GET http://localhost:3000/weather?city=London
```

Visual Crossing receives the city in the URL path and the following query parameters:

```text
unitGroup=metric
key=<WEATHER_API_KEY>
contentType=json
```

The backend transforms the provider response into a smaller response used by the frontend:

```json
{
  "city": "London",
  "temperature": 19,
  "description": "Clear",
  "humidity": 58.9,
  "windSpeed": 9.6
}
```

The frontend does not receive the Visual Crossing API key or the complete provider response.

### `GET /background?condition={condition}`

Retrieves a condition-specific landscape image from Pexels.

Example request:

```text
GET http://localhost:3000/background?condition=rain
```

The backend maps conditions to image searches:

```text
sunny  -> sunny landscape golden hour sky
clouds -> dramatic cloudy sky landscape
rain   -> rainy city street storm clouds
snow   -> snowy mountain landscape winter
fog    -> misty foggy forest landscape
```

The backend sends the Pexels API key in a server-side `Authorization` header and returns only the selected image information:

```json
{
  "url": "https://images.pexels.com/...",
  "photographer": "Photographer name",
  "photographerUrl": "https://www.pexels.com/..."
}
```

The frontend applies `url` as the background image and displays the photographer credit. If the image request fails, the CSS-generated atmospheric scene remains available as a fallback.

## Request and Data Flow

```text
User enters city
       |
       v
frontend/index.html form
       |
       v
frontend/script.js
       |
       | GET /weather?city=...
       v
backend/server.js
       |
       | Visual Crossing request with WEATHER_API_KEY
       v
Normalized weather JSON
       |
       v
Frontend updates text and determines condition
       |
       | GET /background?condition=...
       v
backend/server.js
       |
       | Pexels request with IMAGE_API_KEY
       v
Image URL and attribution JSON
       |
       v
Frontend displays background image and animations
```

All browser-to-backend requests use `window.ATMOS_API_URL` from `frontend/config.js`. In production, this value should be the deployed backend URL. If it is empty, the frontend uses relative paths, which supports serving frontend and backend from the same origin.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` for local development and provide real values there:

```env
WEATHER_API_KEY=your_visualcrossing_api_key
IMAGE_API_KEY=your_pexels_api_key
PORT=5000
FRONTEND_URL=https://your-frontend-domain.example
```

- `WEATHER_API_KEY`: Visual Crossing credential used only by `/weather`
- `IMAGE_API_KEY`: Pexels credential used only by `/background`
- `PORT`: cloud-provided port, with a local fallback of `5000`
- `FRONTEND_URL`: deployed frontend origin allowed by CORS

Never commit `backend/.env`. The root `.gitignore` excludes it, `node_modules`, and the local `frontend/config.js` file.

## Running Locally

Start the backend:

```powershell
cd backend
npm install
npm start
```

The backend listens on `http://localhost:3000` when the local `.env` sets `PORT=3000`.

Start the frontend from a second terminal:

```powershell
cd frontend
live-server
```

Open the URL printed by Live Server. Because the frontend is inside its own folder, start Live Server from `frontend` or open `frontend/index.html` directly. Starting it from the project root displays a directory listing because the root does not contain an `index.html` file.

## Production Deployment

Deploy the `backend` and `frontend` as separate services, or serve the frontend from the same host as the backend.

For the backend, configure the cloud provider's environment variables using the names in `backend/.env.example`. The server reads `process.env.PORT`, so it accepts the port assigned by the cloud platform.

For a separately deployed frontend, set the deployed backend URL in `frontend/config.js`:

```javascript
window.ATMOS_API_URL = "https://your-backend-domain.example";
```

Set the backend's `FRONTEND_URL` to the exact frontend origin, including the protocol but excluding the path. For example:

```env
FRONTEND_URL=https://your-frontend-domain.example
```

The backend allows all origins only when `FRONTEND_URL` is not set, which is convenient for local development but should be replaced with the real frontend URL in production.

## Error Handling

- Missing city returns `400`.
- Missing `WEATHER_API_KEY` or `IMAGE_API_KEY` returns `500`.
- Provider status codes are passed through when available.
- The frontend displays an error message for failed weather requests.
- Failed image requests remove the image layer and preserve the generated CSS scene.

## Security Notes

API keys are sent only from the backend to Visual Crossing and Pexels. They are never placed in HTML, CSS, browser JavaScript, or API responses. Keep `.env` files private and rotate any key that has been exposed publicly.
