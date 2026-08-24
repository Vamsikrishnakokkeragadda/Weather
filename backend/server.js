const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : undefined));
app.use(express.json());

const imageQueries = {
    sunny: "sunny landscape golden hour sky",
    clouds: "dramatic cloudy sky landscape",
    rain: "rainy city street storm clouds",
    snow: "snowy mountain landscape winter",
    fog: "misty foggy forest landscape"
};

// Route: Get weather by city
app.get("/weather", async (req, res) => {
    const city = req.query.city;

    if (!city) {
        return res.status(400).json({ error: "City is required" });
    }

    try {
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "WEATHER_API_KEY is missing from the environment" });
        }

        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}`;

        const response = await axios.get(url, {
            params: {
                unitGroup: "metric",
                key: apiKey,
                contentType: "json"
            }
        });

        // Extract useful data
        const data = response.data;

        const weatherReport = {
            city: data.resolvedAddress || data.address,
            temperature: data.currentConditions.temp,
            description: data.currentConditions.conditions,
            humidity: data.currentConditions.humidity,
            windSpeed: data.currentConditions.windspeed
        };

        res.json(weatherReport);

    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Failed to fetch weather data",
            details: error.response?.data || error.message
        });
    }
});

app.get("/background", async (req, res) => {
    const condition = String(req.query.condition || "clouds").toLowerCase();
    const query = imageQueries[condition] || imageQueries.clouds;
    const imageApiKey = process.env.IMAGE_API_KEY;

    if (!imageApiKey) {
        return res.status(500).json({ error: "IMAGE_API_KEY is missing from the environment" });
    }

    try {
        const response = await axios.get("https://api.pexels.com/v1/search", {
            headers: { Authorization: imageApiKey },
            params: { query, orientation: "landscape", size: "large", per_page: 1 }
        });
        const photo = response.data.photos?.[0];

        if (!photo) {
            return res.status(404).json({ error: "No background image found" });
        }

        res.json({
            url: photo.src.landscape || photo.src.large,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: "Failed to fetch background image",
            details: error.response?.data || error.message
        });
    }
});

// Cloud platforms provide PORT at runtime.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});