/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInVariants5 } from "../../animation/variants";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
}

// Weather codes mapping to icons and descriptions
const getWeatherInfo = (code: number, isDay: boolean) => {
  // WMO Weather interpretation codes
  const weatherMap: Record<number, { icon: string; description: string }> = {
    0: { icon: isDay ? "sun" : "moon", description: "Clear sky" },
    1: { icon: isDay ? "sun-cloud" : "moon-cloud", description: "Mainly clear" },
    2: { icon: "cloud", description: "Partly cloudy" },
    3: { icon: "clouds", description: "Overcast" },
    45: { icon: "fog", description: "Fog" },
    48: { icon: "fog", description: "Depositing rime fog" },
    51: { icon: "drizzle", description: "Light drizzle" },
    53: { icon: "drizzle", description: "Moderate drizzle" },
    55: { icon: "drizzle", description: "Dense drizzle" },
    61: { icon: "rain", description: "Slight rain" },
    63: { icon: "rain", description: "Moderate rain" },
    65: { icon: "rain-heavy", description: "Heavy rain" },
    71: { icon: "snow", description: "Slight snow" },
    73: { icon: "snow", description: "Moderate snow" },
    75: { icon: "snow", description: "Heavy snow" },
    80: { icon: "rain", description: "Rain showers" },
    81: { icon: "rain", description: "Moderate showers" },
    82: { icon: "rain-heavy", description: "Violent showers" },
    95: { icon: "thunder", description: "Thunderstorm" },
    96: { icon: "thunder", description: "Thunderstorm with hail" },
    99: { icon: "thunder", description: "Thunderstorm with heavy hail" },
  };

  return weatherMap[code] || { icon: "cloud", description: "Unknown" };
};

const WeatherIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case "sun":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
      );
    case "moon":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
        </svg>
      );
    case "sun-cloud":
    case "moon-cloud":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
        </svg>
      );
    case "cloud":
    case "clouds":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" clipRule="evenodd" />
        </svg>
      );
    case "rain":
    case "drizzle":
    case "rain-heavy":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" clipRule="evenodd" />
          <path d="M8 14l-1 4M12 14l-1 4M16 14l-1 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "snow":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" clipRule="evenodd" />
          <circle cx="8" cy="16" r="1" />
          <circle cx="12" cy="18" r="1" />
          <circle cx="16" cy="16" r="1" />
        </svg>
      );
    case "thunder":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" clipRule="evenodd" />
          <path d="M13 12l-2 4h3l-2 4" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "fog":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 15h18M3 12h18M3 9h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" clipRule="evenodd" />
        </svg>
      );
  }
};

export default function WeatherWidget({ customIndex = 19 }: { customIndex?: number }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [location, setLocation] = useState("Abakaliki");

  // EBSU is located in Abakaliki, Ebonyi State, Nigeria
  // Coordinates: 6.3249° N, 8.1137° E
  const EBSU_LAT = 6.3249;
  const EBSU_LON = 8.1137;

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(false);

        // Using Open-Meteo API (free, no API key required)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${EBSU_LAT}&longitude=${EBSU_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=Africa%2FLagos`
        );

        if (!response.ok) throw new Error("Failed to fetch weather");

        const data = await response.json();
        
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          isDay: data.current.is_day === 1,
        });
        setLocation("Abakaliki");
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode, weather.isDay) : null;

  // Get background gradient based on weather and time
  const getBackgroundGradient = () => {
    if (!weather) return "from-gray-200 to-gray-300";
    
    if (!weather.isDay) {
      return "from-slate-800 to-slate-900";
    }
    
    switch (weatherInfo?.icon) {
      case "sun":
        return "from-sky-400 to-blue-500";
      case "sun-cloud":
      case "moon-cloud":
        return "from-sky-300 to-blue-400";
      case "cloud":
      case "clouds":
        return "from-slate-300 to-slate-400";
      case "rain":
      case "drizzle":
      case "rain-heavy":
        return "from-slate-400 to-slate-600";
      case "thunder":
        return "from-slate-600 to-slate-800";
      default:
        return "from-sky-400 to-blue-500";
    }
  };

  const getTextColor = () => {
    if (!weather?.isDay) return "text-white";
    if (["rain", "rain-heavy", "thunder"].includes(weatherInfo?.icon || "")) {
      return "text-white";
    }
    return "text-white";
  };

  return (
    <motion.div
      variants={fadeInVariants5}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      custom={customIndex}
      className={`shadow rounded-lg w-full overflow-hidden bg-gradient-to-br ${getBackgroundGradient()} ${getTextColor()}`}
    >
      {loading ? (
        <div className="p-3 xxss:p-4 h-full flex items-center justify-center min-h-[120px]">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="w-10 h-10 xxss:w-12 xxss:h-12 bg-white/20 rounded-full"></div>
            <div className="h-3 w-16 bg-white/20 rounded"></div>
          </div>
        </div>
      ) : error ? (
        <div className="p-3 xxss:p-4 h-full flex flex-col items-center justify-center min-h-[120px]">
          <svg className="w-8 h-8 xxss:w-10 xxss:h-10 text-white/60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xss xxss:text-xs text-white/70">Unable to load weather</p>
        </div>
      ) : weather && weatherInfo ? (
        <div className="p-2.5 xxss:p-3 sm:p-4">
          {/* Location */}
          <div className="flex items-center gap-1 mb-2 xxss:mb-3">
            <svg className="w-3 h-3 xxss:w-3.5 xxss:h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="text-xss xxss:text-xs font-medium opacity-90">{location}</span>
          </div>

          {/* Main weather info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 xxss:gap-3">
              <WeatherIcon 
                type={weatherInfo.icon} 
                className="w-10 h-10 xxss:w-12 xxss:h-12 sm:w-14 sm:h-14 drop-shadow-lg" 
              />
              <div>
                <p className="text-2xl xxss:text-3xl sm:text-4xl font-bold leading-none">
                  {weather.temperature}°
                </p>
                <p className="text-xss xxss:text-xs opacity-80 mt-0.5">
                  {weatherInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="flex items-center gap-3 xxss:gap-4 mt-2 xxss:mt-3 pt-2 xxss:pt-3 border-t border-white/20">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 xxss:w-3.5 xxss:h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span className="text-sss xxss:text-xss">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 xxss:w-3.5 xxss:h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span className="text-sss xxss:text-xss">{weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
