// PENTING: Ganti dengan API Key OpenWeatherMap milik Anda
// Daftar di https://openweathermap.org/api untuk mendapatkan kunci gratis
const API_KEY = "542c7579b660f1bda9f189eae8762e73"; // Menggunakan key public untuk demo, ganti di production

// DOM Elements
const appContainer = document.getElementById("app-container");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const weatherInfo = document.getElementById("weather-info");
const errorMsg = document.getElementById("error-msg");
const loader = document.getElementById("loader");

// Weather Data Elements
const cityNameEl = document.getElementById("city-name");
const tempValEl = document.getElementById("temp-val");
const weatherDescEl = document.getElementById("weather-desc");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const wIconEl = document.getElementById("w-icon");

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  getUserLocation();
});

// Event Listeners for Search
searchBtn.addEventListener("click", () => {
  if (cityInput.value.trim() !== "") {
    fetchWeather(cityInput.value);
  }
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && cityInput.value.trim() !== "") {
    fetchWeather(cityInput.value);
  }
});

// Get User's Geolocation
function getUserLocation() {
  showLoading();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoords(lat, lon);
      },
      (error) => {
        console.warn("Geolocation ditolak atau gagal:", error);
        // Fallback jika lokasi tidak diizinkan
        fetchWeather("Jakarta");
      },
    );
  } else {
    fetchWeather("Jakarta");
  }
}

// Fetch API via City Name
async function fetchWeather(city) {
  showLoading();
  errorMsg.classList.remove("show");
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=id`,
    );
    const data = await response.json();

    if (data.cod === "404" || data.cod === 404) {
      throw new Error("Kota tidak ditemukan");
    }

    updateUI(data);
  } catch (error) {
    showError();
  }
}

// Fetch API via Coordinates
async function fetchWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`,
    );
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    showError();
  }
}

// Update UI with Transitions
function updateUI(data) {
  // Fade out current info
  weatherInfo.classList.add("hidden");
  loader.style.display = "none";

  setTimeout(() => {
    // Parse Data
    const { name } = data;
    const { temp, humidity } = data.main;
    const { speed } = data.wind;
    const { description, main: weatherMain, id: weatherId } = data.weather[0];

    // Update DOM
    cityNameEl.textContent = name;
    tempValEl.textContent = Math.round(temp);
    weatherDescEl.textContent = description;
    humidityEl.textContent = `${humidity}%`;
    // Convert m/s to km/h
    windSpeedEl.textContent = `${Math.round(speed * 3.6)} km/j`;

    // Update Icon & Theme based on weather condition
    setWeatherThemeAndIcon(weatherMain, weatherId);

    // Fade in new info
    weatherInfo.classList.remove("hidden");
    cityInput.value = "";
  }, 400); // Wait for fade-out animation
}

// Dynamic Theme and Icons Mapping
function setWeatherThemeAndIcon(mainCondition, conditionId) {
  // Reset classes
  appContainer.className = "";
  wIconEl.className = "fas";

  const condition = mainCondition.toLowerCase();

  if (condition === "clear") {
    appContainer.classList.add("theme-clear");
    wIconEl.classList.add("fa-sun");
  } else if (condition === "clouds") {
    appContainer.classList.add("theme-clouds");
    wIconEl.classList.add("fa-cloud");
  } else if (condition === "rain" || condition === "drizzle") {
    appContainer.classList.add("theme-rain");
    wIconEl.classList.add("fa-cloud-rain");
  } else if (condition === "thunderstorm") {
    appContainer.classList.add("theme-thunderstorm");
    wIconEl.classList.add("fa-poo-storm"); // Using alternative for lightning
  } else if (condition === "snow") {
    appContainer.classList.add("theme-snow");
    wIconEl.classList.add("fa-snowflake");
  } else {
    // Default for atmosphere (mist, haze, smoke, etc)
    appContainer.classList.add("theme-default");
    wIconEl.classList.add("fa-smog");
  }
}

// Loading & Error States
function showLoading() {
  weatherInfo.classList.add("hidden");
  errorMsg.classList.remove("show");
  loader.style.display = "block";
}

function showError() {
  loader.style.display = "none";
  weatherInfo.classList.add("hidden");
  errorMsg.classList.add("show");
}
