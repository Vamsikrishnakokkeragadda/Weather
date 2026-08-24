const weatherApp = document.getElementById("weatherApp");
const searchForm = document.getElementById("searchForm");
const themeToggle = document.getElementById("themeToggle");
const API_BASE_URL = (window.ATMOS_API_URL || "").trim().replace(/\/+$/, "");
let carouselTimer;

function apiUrl(path) {
    return `${API_BASE_URL}${path}`;
}

function applyTheme(theme) {
    weatherApp.dataset.theme = theme;
    const isLight = theme === "light";
    themeToggle.querySelector(".theme-icon").innerText = isLight ? "☾" : "☼";
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
}

applyTheme(localStorage.getItem("atmos-theme") || "dark");
themeToggle.addEventListener("click", () => {
    const nextTheme = weatherApp.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("atmos-theme", nextTheme);
    applyTheme(nextTheme);
});

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    getWeather();
});

function startMobileCarousel() {
    const detailRow = document.querySelector(".detail-row");
    if (!detailRow || window.matchMedia("(max-width: 720px)").matches) {
        if (detailRow && !carouselTimer) {
            carouselTimer = setInterval(() => {
                const nextPosition = detailRow.scrollLeft + detailRow.clientWidth + 12;
                detailRow.scrollTo({ left: nextPosition >= detailRow.scrollWidth ? 0 : nextPosition, behavior: "smooth" });
            }, 4500);
        }
        return;
    }
    clearInterval(carouselTimer);
    carouselTimer = undefined;
}

window.addEventListener("resize", startMobileCarousel);
startMobileCarousel();

function setText(id, value) {
    document.getElementById(id).innerText = value;
}

function setCondition(description, windSpeed) {
    const words = description.toLowerCase();
    const numericWind = Number(windSpeed) || 0;
    let condition = "clouds";
    if (words.includes("rain") || words.includes("drizzle") || words.includes("shower")) condition = "rain";
    else if (words.includes("snow") || words.includes("ice")) condition = "snow";
    else if (words.includes("fog") || words.includes("mist") || words.includes("haze")) condition = "fog";
    else if (words.includes("clear") || words.includes("sun")) condition = "sunny";
    weatherApp.dataset.condition = condition;
    weatherApp.dataset.windy = numericWind >= 20 ? "true" : "false";
    weatherApp.style.setProperty("--wind-speed", `${Math.max(0.35, 2.8 - Math.min(numericWind, 30) / 14)}s`);
    weatherApp.style.setProperty("--wind-angle", `${Math.min(12, 3 + numericWind / 4)}deg`);
    setText("statusText", `${condition.toUpperCase()} CONDITIONS`);
    setText("skyDetail", condition[0].toUpperCase() + condition.slice(1));
    loadBackground(condition);
}

async function loadBackground(condition) {
    const image = document.getElementById("weatherImage");
    try {
        const response = await fetch(apiUrl(`/background?condition=${encodeURIComponent(condition)}`));
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Background image unavailable");
        image.style.backgroundImage = `url("${data.url}")`;
        image.classList.add("is-loaded");
        const credit = document.getElementById("imageCredit");
        credit.innerText = `Photo: ${data.photographer}`;
        credit.title = "Photo from Pexels";
    } catch (error) {
        image.classList.remove("is-loaded");
        console.warn(error.message);
    }
}

async function getWeather() {
    const city = document.getElementById("cityInput").value.trim();

    if (!city) {
        alert("Please enter a city name");
        return;
    }

    try {
        const response = await fetch(apiUrl(`/weather?city=${encodeURIComponent(city)}`));
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.details?.message || data.error || "Failed to fetch weather data");
        }

        setText("city", data.city);
        setText("sideCity", data.city);
        setText("temp", Math.round(data.temperature));
        setText("gaugeTemp", Math.round(data.temperature));
        setText("desc", data.description);
        setText("humidity", data.humidity);
        setText("humidityDetail", data.humidity);
        setText("wind", data.windSpeed);
        setText("windDetail", data.windSpeed);
        setText("sideDate", new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }));
        setText("lastUpdated", `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        setCondition(data.description, data.windSpeed);

    } catch (error) {
        setText("statusText", "UNABLE TO LOAD WEATHER");
        alert(error.message);
        console.error(error);
    }
}