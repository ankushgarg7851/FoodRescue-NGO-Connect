const express = require("express");
const router = express.Router();

// Weather code translation helper
function getWeatherDescription(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    80: "Slight rain showers",
    95: "Thunderstorm"
  };
  return map[code] || "Clear / Mild";
}

/**
 * PARAMETER 1: External API Call
 * GET /api/external/weather-advisory
 * Fetches real-time weather from Open-Meteo API and calculates
 * food safety & spoilage risk advisory for perishable surplus food.
 */
router.get("/weather-advisory", async (req, res) => {
  const lat = req.query.lat || "28.4595";
  const lon = req.query.lon || "77.0266";
  const locationName = req.query.city || "Delhi NCR / Gurugram";

  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
    lat
  )}&longitude=${encodeURIComponent(
    lon
  )}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;

  try {
    const apiResponse = await fetch(apiUrl, { signal: AbortSignal.timeout(6000) });

    if (!apiResponse.ok) {
      throw new Error(`Open-Meteo responded with status ${apiResponse.status}`);
    }

    const weatherData = await apiResponse.json();
    const current = weatherData.current || {};
    const tempC = Math.round(Number(current.temperature_2m ?? 24));
    const humidity = Math.round(Number(current.relative_humidity_2m ?? 50));
    const weatherCode = Number(current.weather_code ?? 0);
    const weatherDesc = getWeatherDescription(weatherCode);

    // Calculate food spoilage risk based on ambient temperature
    let riskLevel = "Low";
    let safeWindowHours = 4;
    let advisory = "Ambient temperature is cool. Cooked food remains safe for standard 4-hour pickup window.";

    if (tempC >= 32) {
      riskLevel = "High";
      safeWindowHours = 1.5;
      advisory = "High heat alert! Bacterial growth accelerates above 32°C. Must transport in insulated bags and distribute within 90 minutes.";
    } else if (tempC >= 25) {
      riskLevel = "Moderate";
      safeWindowHours = 2.5;
      advisory = "Warm weather advisory. Cooked and dairy foods should be collected and served within 2 to 3 hours.";
    }

    return res.json({
      success: true,
      source: "Open-Meteo Global Weather API (External)",
      location: locationName,
      coordinates: { latitude: lat, longitude: lon },
      weather: {
        temperatureC: tempC,
        temperatureF: Math.round(tempC * 1.8 + 32),
        humidityPercentage: humidity,
        condition: weatherDesc,
        weatherCode
      },
      foodSafetyAdvisory: {
        riskLevel,
        safeWindowHours,
        advisory,
        recommendedContainer: tempC >= 25 ? "Insulated Thermal Box" : "Standard Covered Food Containers",
        perishableWarning: tempC >= 28 ? "Urgent pickup recommended for cooked meals" : "Standard handling"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("External weather API error:", error.message);

    // Fallback safe advisory in case network fails
    return res.json({
      success: true,
      source: "FoodRescue Fallback Safety Engine",
      location: locationName,
      weather: {
        temperatureC: 26,
        humidityPercentage: 55,
        condition: "Partly Cloudy",
        fallback: true
      },
      foodSafetyAdvisory: {
        riskLevel: "Moderate",
        safeWindowHours: 2.5,
        advisory: "Warm ambient temperature estimated. Maintain covered transit and rescue surplus within 2.5 hours.",
        recommendedContainer: "Insulated Containers"
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PARAMETER 1: External API Call
 * GET /api/external/food-quote
 * Fetches motivational quotes and food waste reduction facts from external API.
 */
router.get("/food-quote", async (req, res) => {
  const fallbackQuotes = [
    {
      quote: "Cutting food waste is a delicious way of saving money, helping the world and fighting hunger.",
      author: "Tristram Stuart",
      topic: "Food Rescue"
    },
    {
      quote: "If food waste were a country, it would be the third largest emitter of greenhouse gases.",
      author: "United Nations FAO",
      topic: "Sustainability"
    },
    {
      quote: "Hunger is not a problem of food production; it is a problem of food distribution and compassion.",
      author: "World Food Programme",
      topic: "Community"
    }
  ];

  try {
    const apiRes = await fetch("https://dummyjson.com/quotes/random", {
      signal: AbortSignal.timeout(4000)
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return res.json({
        success: true,
        source: "DummyJSON Quotes API (External)",
        quote: data.quote,
        author: data.author,
        foodRescueFact: "Over 1/3 of all food produced globally goes to waste while 1 in 9 people goes hungry."
      });
    }
    throw new Error("External quote service unavailable");
  } catch {
    const picked = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return res.json({
      success: true,
      source: "FoodRescue Curated Quotes",
      ...picked
    });
  }
});

module.exports = router;
