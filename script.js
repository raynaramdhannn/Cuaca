const API_KEY = "542c7579b660f1bda9f189eae8762e73"; // Gunakan key Anda di production

// DOM Elements
const appContainer = document.getElementById("app-container");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const weatherInfo = document.getElementById("weather-info");
const errorMsg = document.getElementById("error-msg");
const loader = document.getElementById("loader");
const forecastContainer = document.getElementById("forecast-container");

// Weather Data Elements
const cityNameEl = document.getElementById("city-name");
const tempValEl = document.getElementById("temp-val");
const weatherDescEl = document.getElementById("weather-desc");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const wIconEl = document.getElementById("w-icon");

// Hari dalam seminggu untuk terjemahan
const daysIndo = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

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
        fetchWeather("Jakarta");
      },
    );
  } else {
    fetchWeather("Jakarta");
  }
}

// Fetch API Current Weather & Forecast via City Name
async function fetchWeather(city) {
  showLoading();
  errorMsg.classList.remove("show");
  try {
    // Fetch current weather
    const resWeather = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=id`,
    );
    const dataWeather = await resWeather.json();

    if (dataWeather.cod === "404" || dataWeather.cod === 404) {
      throw new Error("Kota tidak ditemukan");
    }

    // Fetch forecast using coordinates from current weather
    const { lat, lon } = dataWeather.coord;
    const resForecast = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`,
    );
    const dataForecast = await resForecast.json();

    updateUI(dataWeather, dataForecast);
  } catch (error) {
    showError();
  }
}

// Fetch API Current Weather & Forecast via Coordinates
async function fetchWeatherByCoords(lat, lon) {
  try {
    const resWeather = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`,
    );
    const dataWeather = await resWeather.json();

    const resForecast = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`,
    );
    const dataForecast = await resForecast.json();

    updateUI(dataWeather, dataForecast);
  } catch (error) {
    showError();
  }
}

// Helper untuk mendapatkan ikon fontawesome berdasarkan kondisi
function getIconClass(mainCondition) {
  const condition = mainCondition.toLowerCase();
  if (condition === "clear") return "fa-sun";
  if (condition === "clouds") return "fa-cloud";
  if (condition === "rain" || condition === "drizzle") return "fa-cloud-rain";
  if (condition === "thunderstorm") return "fa-poo-storm";
  if (condition === "snow") return "fa-snowflake";
  return "fa-smog";
}

// Update UI with Transitions
function updateUI(currentData, forecastData) {
  // Fade out current info
  weatherInfo.classList.add("hidden");
  loader.style.display = "none";

  setTimeout(() => {
    // 1. Update Cuaca Saat Ini
    const { name } = currentData;
    const { temp, humidity } = currentData.main;
    const { speed } = currentData.wind;
    const {
      description,
      main: weatherMain,
      id: weatherId,
    } = currentData.weather[0];

    cityNameEl.textContent = name;
    tempValEl.textContent = Math.round(temp);
    weatherDescEl.textContent = description;
    humidityEl.textContent = `${humidity}%`;
    windSpeedEl.textContent = `${Math.round(speed * 3.6)} km/j`;

    setWeatherThemeAndIcon(weatherMain, weatherId);

    // 2. Update Cuaca 5 Hari ke Depan
    updateForecastUI(forecastData.list);

    // Fade in new info
    weatherInfo.classList.remove("hidden");
    cityInput.value = "";
  }, 400);
}

// Update Forecast DOM
function updateForecastUI(list) {
  forecastContainer.innerHTML = "";
  const dailyData = [];
  const processedDays = new Set();

  // Dapatkan tanggal "hari ini" berdasarkan data pertama API untuk di-skip
  const apiToday = list[0].dt_txt.split(" ")[0];

  for (const item of list) {
    const dateStr = item.dt_txt.split(" ")[0];

    // Skip data hari ini, kita hanya butuh 5 hari selanjutnya
    if (dateStr === apiToday) continue;

    if (!processedDays.has(dateStr)) {
      processedDays.add(dateStr);
      // Idealnya ambil data jam 12 siang. Jika API merekam data setelah jam 12, kita pakai data item pertama yang tersedia hari itu.
      const middayData =
        list.find((d) => d.dt_txt.includes(`${dateStr} 12:00:00`)) || item;
      dailyData.push(middayData);

      if (dailyData.length === 5) break;
    }
  }

  // Generate HTML untuk setiap hari
  const forecastHTML = dailyData
    .map((data) => {
      const dateObj = new Date(data.dt * 1000);
      const dayName = daysIndo[dateObj.getDay()];
      const icon = getIconClass(data.weather[0].main);
      const tempRound = Math.round(data.main.temp);

      return `
                    <div class="forecast-item">
                        <p>${dayName}</p>
                        <i class="fas ${icon}"></i>
                        <p class="f-temp">${tempRound}°</p>
                    </div>
                `;
    })
    .join("");

  forecastContainer.innerHTML = forecastHTML;
}

// Dynamic Theme and Icons Mapping
function setWeatherThemeAndIcon(mainCondition, conditionId) {
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
    wIconEl.classList.add("fa-poo-storm");
  } else if (condition === "snow") {
    appContainer.classList.add("theme-snow");
    wIconEl.classList.add("fa-snowflake");
  } else {
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
