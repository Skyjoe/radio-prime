const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const resultContainer = document.getElementById('result-container');
const cityNameEl = document.getElementById('city-name');
const temperatureEl = document.getElementById('temperature');
const localTimeEl = document.getElementById('local-time');
const errorMessageEl = document.getElementById('error-message');
const loader = document.getElementById('loader');
const forecastSection = document.getElementById('forecast-section');
const forecastContainer = document.getElementById('forecast-container');
const themeBtn = document.getElementById('theme-btn');
const appContainer = document.getElementById('app-container');

// --- NOVO: referência ao mapa
let mapInstance;

// Crypto Elements
const cryptoInput = document.getElementById('crypto-input');
const cryptoDatalist = document.getElementById('crypto-suggestions');
const addCryptoBtn = document.getElementById('add-crypto-btn');
const cryptoList = document.getElementById('crypto-list');

// Crypto Modal Elements
const cryptoModal = document.getElementById('crypto-modal');
const modalTitle = document.getElementById('modal-title');
const cryptoChart = document.getElementById('crypto-chart');
const modalLoading = document.getElementById('modal-loading');
const closeModal = document.querySelector('.close');

let chartInstance = null;
let currentChartDays = 1;

// Track which crypto is currently shown in the modal
let currentModalCryptoId = null;
let currentModalCryptoName = null;
let currentModalCryptoSymbol = null;

// Radio Player Elements
const stationSelect = document.getElementById('station-select');
const playPauseBtn = document.getElementById('play-pause-btn');
const volumeSlider = document.getElementById('volume-slider');
const audioPlayer = document.getElementById('audio-player');

const radioStations = [
       { name: 'Selecione uma rádio...', url: '' },
    { name: 'Radio Gold Instrumental', url: 'https://centova.svdns.com.br:19373/stream?1728788287925' },
    { name: 'Beautiful Instrumental', url: 'https://s3.voscast.com:10038/stream' },    
    { name: 'Best New Age', url: 'https://104.153.209.180:8000/;stream.mp3' },
    { name: 'Cinemix', url: 'https://kathy.torontocast.com:1825/stream' },
    { name: 'Esotérica Fm', url: 'https://canais.esoterica.fm.br/8002/stream/1/' },
    { name: 'Beautiful Instrumental Channel', url: 'https://hydra.cdnstream.com/1822_128' },
    { name: 'Beautiful Music', url: 'https://radio.streemlion.com:1665/stream?' },
    { name: 'Chinese Music', url: 'https://radio.chinesemusicworld.com/chinesemusic.mp3' },
    { name: 'Lynn Classical', url: 'https://radio.linn.co.uk:8004/autodj' },    
    { name: 'Soothing Radio', url: 'https://193.111.125.15:8010/soothingradio' },
    { name: 'Enigmatic 3', url: 'https://radio.enigmatic.su:8050/radio' },
    { name: 'Actions', url: 'https://lizeradio.com/webplayer/actions.php' },
    { name: 'Relaxation Island', url: 'https://198.178.123.5:7932/' },
    { name: 'Enigmatic Immersion', url: 'https://radio.enigmatic.su:8040/radio' },
    { name: 'Radio Caprice', url: 'https://79.120.77.11:8002/newage' },    
    { name: 'Instrumental Hits Radio', url: 'https://162.244.81.98:8130/listen' },
    { name: 'Instrumentales de Oro', url: 'https://stream-169.zeno.fm/0anygxe1b1duv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiIwYW55Z3hlMWIxZHV2IiwiaG9zdCI6InN0cmVhbS0xNjkuemVuby5mbSIsInJ0dGwiOjUsImp0aSI6ImRtclRid01uUzJDT2JLaVFkX0RlTHciLCJpYXQiOjE3NTc0NDQyOTMsImV4cCI6MTc1NzQ0NDM1M30.ZhQSv9jIwupM4LOmL9v568unimsZ8YMsWByPTxEFk1A' },
    { name: 'Instrumental Hits', url: 'https://panel.retrolandigital.com:8130/listen'},
    { name: 'Instrumental Radio', url: ' https://stream-155.zeno.fm/3hhp1s4z8zhvv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiIzaGhwMXM0ejh6aHZ2IiwiaG9zdCI6InN0cmVhbS0xNTUuemVuby5mbSIsInJ0dGwiOjUsImp0aSI6ImJTM0JaSFB0UU9tWmEwbHNhbkk2dEEiLCJpYXQiOjE3NTc0NDUxNzgsImV4cCI6MTc1NzQ0NTIzOH0.hPkcj23aGyJMEj6nBGhq0M8O-9SmgxoosG6kklPPjEk'},
    { name: 'Easy Instrumentals', url: 'https://nl4.mystreaming.net/uber/easyinstrumentals/icecast.audio'}
];

let allAvailableCryptos = [];
let trackedCryptos = [];
let cryptoUpdateInterval;

const COINGECKO_API_URL = '/api/coingecko?endpoint=';

let isPlaying = false;
let timeInterval;

let usdToBrl = 5.25; // valor padrão, será atualizado
let lastUsdBrlFetch = 0; // timestamp da última busca
const USD_BRL_CACHE_TIME = 60000; // cache de 1 minuto

// CORRIGIDO: Função com cache para evitar rate limit
async function fetchUsdToBrl() {
  try {
    // Verifica se o cache ainda é válido
    const now = Date.now();
    if (now - lastUsdBrlFetch < USD_BRL_CACHE_TIME) {
      console.log('Usando cotação USD/BRL em cache:', usdToBrl);
      return usdToBrl;
    }

    // A URL completa precisa ser codificada corretamente
    const endpoint = encodeURIComponent('simple/price?ids=tether&vs_currencies=brl');
    const response = await fetch(`/api/coingecko?endpoint=${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Resposta USD/BRL:', data); // Debug

    // Verifica se tem erro de rate limit
    if (data.status && data.status.error_code) {
      console.warn('Rate limit da CoinGecko atingido, usando valor em cache');
      return usdToBrl;
    }

    // Verifica se a resposta tem o formato esperado
    if (data && data.tether && typeof data.tether.brl === 'number') {
      usdToBrl = data.tether.brl;
      lastUsdBrlFetch = now;
      console.log('Cotação USD/BRL atualizada:', usdToBrl);
      return data.tether.brl;
    } else {
      throw new Error('Formato de resposta inválido');
    }
  } catch (error) {
    console.error('Falha ao buscar cotação do dólar:', error);
    // Mantém o valor anterior se já tiver um valor válido
    return usdToBrl;
  }
}

// Atualiza cotação do dólar a cada 2 minutos (para evitar rate limit)
setInterval(async () => {
  await fetchUsdToBrl();
}, 120000); // 2 minutos

// Populate Radio Stations
function populateStations() {
    radioStations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.url;
        option.textContent = station.name;
        stationSelect.appendChild(option);
    });
}

// Radio Player Logic
function togglePlayPause() {
  if (audioPlayer.src && audioPlayer.src !== window.location.href) {
    if (isPlaying) {
      audioPlayer.pause();
      playPauseBtn.classList.remove('pause-icon');
      playPauseBtn.classList.add('play-icon');
    } else {
      audioPlayer.play().catch(e => console.error("Error playing audio:", e));
      playPauseBtn.classList.remove('play-icon');
      playPauseBtn.classList.add('pause-icon');
    }
    isPlaying = !isPlaying;
  }
}

function handleStationChange() {
    const selectedUrl = stationSelect.value;
    if (selectedUrl) {
        audioPlayer.src = selectedUrl;
        audioPlayer.play().catch(e => console.error("Error playing audio:", e));
        isPlaying = true;
        playPauseBtn.classList.remove('play-icon');
        playPauseBtn.classList.add('pause-icon');
    } else {
        audioPlayer.pause();
        audioPlayer.src = '';
        playPauseBtn.classList.remove('pause-icon');
        playPauseBtn.classList.add('play-icon');
        isPlaying = false;
    }
}

playPauseBtn.addEventListener('click', togglePlayPause);
stationSelect.addEventListener('change', handleStationChange);
volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value;
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await fetchUsdToBrl();
    populateStations();
    audioPlayer.volume = volumeSlider.value;
    loadAvailableCryptos();
    loadTrackedCryptos();

    // Chart time control listeners
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('chart-time-btn')) {
            document.querySelectorAll('.chart-time-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const days = parseFloat(e.target.dataset.days);
            currentChartDays = days;
            if (currentModalCryptoId) {
                showCryptoChart(currentModalCryptoId, currentModalCryptoName, currentModalCryptoSymbol);
            }
        }
    });

    // Carregar cidade padrão ao abrir
    const savedCity = localStorage.getItem("defaultCity") || "Jundiaí";
    getWeatherAndTime(savedCity);
});

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherAndTime(city);
        localStorage.setItem("defaultCity", city);
    }
});
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherAndTime(city);
            localStorage.setItem("defaultCity", city);
        }
    }
});

// === BACKGROUND ESTILO EQUALIZADOR ===
const colorSchemes = {
  blue: ['#001F3F', '#003366', '#004C99', '#0066CC', '#0080FF', '#3399FF'],
  green: ['#004D1A', '#006622', '#008033', '#009933', '#00B33C', '#00CC44'],
  pink: ['#330033', '#4D004D', '#660066', '#800080', '#990099', '#B300B3'],
  teal: ['#003333', '#004D4D', '#006666', '#008080', '#009999', '#00B3B3'],
  orange: ['#331100', '#662200', '#993300', '#CC4400', '#FF5500', '#FF7733'],
  yellow: ['#332600', '#664D00', '#997300', '#CC9900', '#FFBF00', '#FFD633']
};

const columns = [
  'blue',    
  'green',   
  'teal',    
  'orange',  
  'pink',    
  'yellow'   
];
const numColumns = columns.length;

function createColumns() {
  const wrapper = document.getElementById('wrapper');
  wrapper.innerHTML = '';
  wrapper.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
  
  columns.forEach(colorName => {
    const column = document.createElement('div');
    column.className = 'column';
    column.dataset.colorScheme = colorName;

    const boxCount = Math.ceil(window.innerHeight / 16);
    for (let i = 0; i < boxCount; i++) {
      const box = document.createElement('div');
      box.className = 'box';
      column.appendChild(box);
    }

    wrapper.appendChild(column);
  });
}

function renderEqualizer() {
  if (!analyser) return;
  requestAnimationFrame(renderEqualizer);

  analyser.getByteFrequencyData(dataArray);

  const columnsEl = document.querySelectorAll('.column');

  columnsEl.forEach((column, i) => {
    const boxes = column.querySelectorAll('.box');
    
    let sourceColumnIndex;
    if (i === 4) sourceColumnIndex = 2;
    else if (i === 5) sourceColumnIndex = 3;
    else sourceColumnIndex = i;
    
    const scheme = colorSchemes[column.dataset.colorScheme];

    const bufferLen = dataArray.length;
    const start = Math.floor((sourceColumnIndex / columnsEl.length) * bufferLen);
    const end = Math.floor(((sourceColumnIndex + 1) / columnsEl.length) * bufferLen);
    
    let sum = 0;
    for (let j = start; j < end; j++) sum += dataArray[j];
    let value = sum / (end - start);
    
    value = Math.min(255, value * 1.15);

    const activeBoxes = Math.round((value / 255) * boxes.length);

    boxes.forEach((box, j) => {
      if (j < activeBoxes) {
        box.style.backgroundColor = scheme[j % scheme.length];
      } else {
        box.style.backgroundColor = '#000000ff';
      }
    });
  });
}

// ===== Integração com rádio =====
let audioCtx, analyser, dataArray;

audioPlayer.addEventListener("play", () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audioPlayer);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    renderEqualizer();
  }
});

createColumns();
window.addEventListener('resize', () => {
  createColumns();
});

function isDarkColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
}

function setTextColor(container, color) {
    const textColor = isDarkColor(color) ? '#fff' : '#000';
    container.style.setProperty('color', textColor, 'important');
    container.querySelectorAll('*').forEach(el => {
        if (
            el.tagName !== 'INPUT' &&
            el.tagName !== 'BUTTON' &&
            el.tagName !== 'SELECT' &&
            el.tagName !== 'TEXTAREA' &&
            el.tagName !== 'OPTION'
        ) {
            el.style.setProperty('color', textColor, 'important');
        }
        if (el.tagName === 'INPUT') {
            el.style.setProperty('color', textColor, 'important');
            el.style.setProperty('background-color', isDarkColor(color) ? '#222' : '#fff', 'important');
            el.style.caretColor = textColor;
        }
    });
    themeBtn.style.setProperty('color', textColor, 'important');
    backgroundBtn.style.setProperty('color', textColor, 'important');
}

const containerColors = [
    '#f5f5f5', '#e0f7fa', '#fff3e0', '#f3e5f5', '#fce4ec',
    '#e8f5e9', '#2c3e50', '#34495e', '#7f8c8d', '#8e44ad', '#c0392b'
];
let currentContainerColor = 0;

const backgroundColors = [
    '#f0f8ff', '#fffaf0', '#fdf5e6', '#e6ffe6', '#fff0f5',
    '#f5f5dc', '#1c1c1c', '#2f2f2f', '#3b3b3b', '#0d47a1', '#4a148c'
];
let currentBackgroundColor = 0;

const backgroundBtn = document.getElementById('background-btn');

themeBtn.addEventListener('click', () => {
    const color = containerColors[currentContainerColor];
    appContainer.style.backgroundColor = color;
    setTextColor(appContainer, color);
    currentContainerColor = (currentContainerColor + 1) % containerColors.length;
});

backgroundBtn.addEventListener('click', () => {
    const color = backgroundColors[currentBackgroundColor];
    document.body.style.backgroundColor = color;
    setTextColor(document.body, color);
    currentBackgroundColor = (currentBackgroundColor + 1) % backgroundColors.length;
});

// --- WEATHER FUNCTIONS ---

function clearInfo() {
    resultContainer.classList.add('hidden');
    forecastSection.classList.add('hidden');
    forecastContainer.innerHTML = '';
    document.getElementById('hourly-forecast').innerHTML = '';
    errorMessageEl.textContent = '';
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
}

function showLoading() {
    loader.classList.remove('hidden');
}

function hideLoading() {
    loader.classList.add('hidden');
}

function showError(message) {
    hideLoading();
    errorMessageEl.textContent = message;
}

async function getWeatherAndTime(cityName = null) {
    const savedCity = localStorage.getItem("defaultCity");
    const city = cityName || savedCity || "Jundiaí";

    clearInfo();
    showLoading();

    try {
        const geoApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=19323201f1e62b73c148d04a7a229454&units=metric&lang=pt`;
        const geoResponse = await fetch(geoApiUrl);
        if (!geoResponse.ok) {
            if (geoResponse.status === 401) throw new Error('Chave de API inválida. Verifique sua API key.');
            throw new Error('Erro ao buscar informações da cidade.');
        }
        const geoData = await geoResponse.json();
        const { id: cityId, name, sys: { country }, timezone, coord } = geoData;

        const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?id=${cityId}&appid=19323201f1e62b73c148d04a7a229454&units=metric&lang=pt`;
        const forecastResponse = await fetch(forecastApiUrl);
        if (!forecastResponse.ok) throw new Error('Erro ao buscar dados do clima.');
        const forecastData = await forecastResponse.json();

        hideLoading();

        const currentTemp = geoData.main.temp;
        cityNameEl.textContent = `${name}, ${country}`;
        temperatureEl.textContent = `Temperatura atual: ${Math.round(currentTemp)}°C`;

        updateTimeWithOffset(timezone);
        if (timeInterval) clearInterval(timeInterval);
        timeInterval = setInterval(() => updateTimeWithOffset(timezone), 1000);

        displayHourlyForecastOpenWeather(forecastData.list, timezone);
        displayDailyForecastOpenWeather(forecastData.list);
        showMap(coord.lat, coord.lon, name);

        resultContainer.classList.remove('hidden');
        setTextColor(appContainer, appContainer.style.backgroundColor || containerColors[currentContainerColor]);
    } catch (error) {
        showError(error.message);
        console.error(error);
    }
}

function updateTimeWithOffset(timezoneOffsetSec) {
    const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
    const localTime = new Date(utc + timezoneOffsetSec * 1000);
    const timeString = localTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    localTimeEl.textContent = `Hora Local: ${timeString}`;
}

function displayHourlyForecastOpenWeather(list, timezoneOffsetSec) {
    const hourlyContainer = document.getElementById('hourly-forecast');
    hourlyContainer.innerHTML = "";

    for (let i = 0; i < 12; i++) {
        const item = list[i];
        if (!item) break;

        const date = new Date((item.dt + timezoneOffsetSec) * 1000);
        const hour = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(item.main.temp);
        const { icon, text } = getWeatherIconOpenWeather(item.weather[0].id);

        const formattedText = text.split(' ').join('<br>');

        const hourBox = document.createElement('div');
        hourBox.innerHTML = `
            <p class="hour">${hour}</p>
            <p class="icon">${icon}</p>
            <p class="desc">${formattedText}</p>
            <p class="temp">${temp}°C</p>
        `;
        hourlyContainer.appendChild(hourBox);
    }
}

function displayDailyForecastOpenWeather(list) {
    forecastContainer.innerHTML = '';
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const daily = {};
    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toISOString().slice(0, 10);
        if (!daily[dayKey]) daily[dayKey] = { temps: [], weatherIds: [] };
        daily[dayKey].temps.push(item.main.temp);
        daily[dayKey].weatherIds.push(item.weather[0].id);
    });

    const days = Object.keys(daily).slice(1, 4);
    days.forEach(dayKey => {
        const dayData = daily[dayKey];
        const minTemp = Math.min(...dayData.temps);
        const maxTemp = Math.max(...dayData.temps);
        const mainWeatherId = dayData.weatherIds[Math.floor(dayData.weatherIds.length / 2)];
        const { icon, text } = getWeatherIconOpenWeather(mainWeatherId);

        const date = new Date(dayKey + 'T00:00:00');
        const dayOfWeek = weekdays[date.getUTCDay()];

        const forecastDayEl = document.createElement('div');
        forecastDayEl.classList.add('forecast-day');
        forecastDayEl.innerHTML = `
            <p class="day">${dayOfWeek}</p>
            <p class="icon">${icon}</p><p class="desc">${text}</p>
            <p class="temps">${Math.round(minTemp)}° / ${Math.round(maxTemp)}°</p>
        `;
        forecastContainer.appendChild(forecastDayEl);
    });

    forecastSection.classList.remove('hidden');
}

function getWeatherIconOpenWeather(code) {
    if (code >= 200 && code < 300) return { icon: '⛈️', text: 'Tempestade' };
    if (code >= 300 && code < 400) return { icon: '🌦️', text: 'Chuva leve' };
    if (code >= 500 && code < 600) return { icon: '🌧️', text: 'Chuva' };
    if (code >= 600 && code < 700) return { icon: '❄️', text: 'Neve' };
    if (code >= 700 && code < 800) return { icon: '🌫️', text: 'Neblina' };
    if (code === 800) return { icon: '☀️', text: 'Céu limpo' };
    if (code === 801) return { icon: '🌤️', text: 'Poucas nuvens' };
    if (code === 802) return { icon: '⛅️', text: 'Parcialmente nublado' };
    if (code === 803 || code === 804) return { icon: '☁️', text: 'Nublado' };
    return { icon: '🌡️', text: 'Indefinido' };
}

async function showMap(lat, lon, city) {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;

    if (mapInstance) {
        mapInstance.remove();
    }

    mapInstance = L.map('map', { attributionControl: false }).setView([lat, lon], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(mapInstance);

    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&polygon_geojson=1`;
        
        const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
        const data = await res.json();

        if (data.length > 0 && data[0].geojson) {
            const geoLayer = L.geoJSON(data[0].geojson, {
                style: {
                    color: "red",
                    weight: 2,
                    fillColor: "rgba(255,0,0,0.2)",
                    fillOpacity: 0.3
                }
            }).addTo(mapInstance);
            
            mapInstance.fitBounds(geoLayer.getBounds());
            mapInstance.setZoom(9);
        } else {
            console.warn("Nenhum polígono encontrado para a cidade, usando apenas o ponto.");
            mapInstance.setView([lat, lon], 12);
            L.marker([lat, lon]).addTo(mapInstance)
                .bindPopup(city)
                .openPopup();
        }
    } catch (err) {
        console.error("Erro ao buscar contorno da cidade:", err);
        mapInstance.setView([lat, lon], 12);
    }

    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 300);
}

// --- CRYPTO FUNCTIONS ---

// CORRIGIDO: Garantir que allAvailableCryptos seja sempre um array
async function loadAvailableCryptos() {
    try {
        const endpoint = encodeURIComponent('coins/list');
        const response = await fetch(`/api/coingecko?endpoint=${endpoint}`);
        if (!response.ok) throw new Error('Não foi possível carregar a lista de criptomoedas.');
        const data = await response.json();
        
        // Garantir que seja um array
        allAvailableCryptos = Array.isArray(data) ? data : [];
        console.log(`${allAvailableCryptos.length} criptomoedas carregadas`);
    } catch (error) {
        console.error("Erro ao buscar criptomoedas:", error);
        allAvailableCryptos = []; // Garantir array vazio em caso de erro
        errorMessageEl.textContent = "Erro ao carregar lista de criptomoedas.";
    }
}

function populateCryptoSuggestions() {
    cryptoDatalist.innerHTML = '';
    const inputValue = cryptoInput.value.trim().toLowerCase();

    if (inputValue.length < 2 || !Array.isArray(allAvailableCryptos)) return;

    const matchingCoins = allAvailableCryptos.filter(coin =>
        (coin.name && coin.name.toLowerCase().startsWith(inputValue)) ||
        (coin.symbol && coin.symbol.toLowerCase().startsWith(inputValue))
    ).slice(0, 50);

    matchingCoins.forEach(coin => {
        const option = document.createElement('option');
        option.value = `${coin.name} (${coin.symbol ? coin.symbol.toUpperCase() : 'N/A'})`;
        cryptoDatalist.appendChild(option);
    });
}

function addCrypto() {
    errorMessageEl.textContent = '';
    const inputValue = cryptoInput.value.trim();
    if (!inputValue) {
        errorMessageEl.textContent = 'Por favor, digite o nome ou símbolo de uma criptomoeda.';
        return;
    }

    if (!Array.isArray(allAvailableCryptos)) {
        errorMessageEl.textContent = 'Lista de criptomoedas ainda não carregada. Aguarde...';
        return;
    }

    let selectedCoin = allAvailableCryptos.find(coin =>
        coin.name.toLowerCase() === inputValue.toLowerCase() ||
        (coin.symbol && coin.symbol.toLowerCase() === inputValue.toLowerCase())
    );

    if (!selectedCoin && inputValue.includes('(') && inputValue.includes(')')) {
        const match = inputValue.match(/(.*)\s+\((.*)\)/);
        if (match && match.length === 3) {
            const namePart = match[1].trim();
            const symbolPart = match[2].trim();
            selectedCoin = allAvailableCryptos.find(coin =>
                coin.name.toLowerCase() === namePart.toLowerCase() &&
                (coin.symbol && coin.symbol.toLowerCase() === symbolPart.toLowerCase())
            );
        }
    }

    if (selectedCoin) {
        const selectedId = selectedCoin.id;
        if (!trackedCryptos.includes(selectedId)) {
            trackedCryptos.push(selectedId);
            saveTrackedCryptos();
            updateCryptoPrices();
            cryptoInput.value = "";
        } else {
            errorMessageEl.textContent = `${selectedCoin.name} já está na sua lista.`;
        }
    } else {
        errorMessageEl.textContent = `Criptomoeda "${inputValue}" não encontrada.`;
    }
}

function removeCrypto(idToRemove) {
    trackedCryptos = trackedCryptos.filter(id => id !== idToRemove);
    saveTrackedCryptos();
    const cryptoItem = document.getElementById(`crypto-${idToRemove}`);
    if (cryptoItem) cryptoItem.remove();
    if (trackedCryptos.length === 0) {
        clearInterval(cryptoUpdateInterval);
        cryptoUpdateInterval = null;
    }
}

function displayCrypto(data) {
    const { id, name, symbol, current_price } = data;

    let item = document.getElementById(`crypto-${id}`);
    if (!item) {
        item = document.createElement('div');
        item.id = `crypto-${id}`;
        item.classList.add('crypto-item');
        item.style.cursor = 'pointer';
        cryptoList.appendChild(item);
    }

    // Corrigido: valor do USDT em reais usando cotação dinâmica
    const precoFinal = symbol.toUpperCase() === "USDT" ? current_price * usdToBrl : current_price;
    const simbolo = symbol.toUpperCase() === "USDT" ? "R$" : "$";

    item.innerHTML = `
        <button class="remove-crypto-btn" title="Remover">&times;</button>
        <h4>${name} <span>(${symbol ? symbol.toUpperCase() : 'N/A'})</span></h4>
        <p>${simbolo} ${precoFinal.toFixed(2)}</p>
    `;

    item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-crypto-btn')) {
            showCryptoChart(id, name, symbol);
        }
    });

    item.querySelector('.remove-crypto-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeCrypto(id);
    });
}

async function showCryptoChart(cryptoId, cryptoName, cryptoSymbol) {
    currentModalCryptoId = cryptoId;
    currentModalCryptoName = cryptoName;
    currentModalCryptoSymbol = cryptoSymbol;

    modalTitle.textContent = `${cryptoName} (${cryptoSymbol ? cryptoSymbol.toUpperCase() : ''}) - Gráfico`;
    modalLoading.classList.remove('hidden');
    cryptoModal.style.display = 'block';

    if (chartInstance) chartInstance.destroy();

    try {
        const endpoint = encodeURIComponent(`coins/${cryptoId}/market_chart?vs_currency=usd&days=${currentChartDays}`);
        const response = await fetch(`/api/coingecko?endpoint=${endpoint}`);
        if (!response.ok) throw new Error('Erro ao buscar dados do gráfico');
        const data = await response.json();

        const prices = data.prices.map(price => price[1]);
        const labels = data.prices.map(price => {
            const date = new Date(price[0]);
            if (currentChartDays <= 0.04) return date.toLocaleTimeString('pt-BR');
            if (currentChartDays <= 1) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
        });

        modalLoading.classList.add('hidden');

        const ctx = cryptoChart.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Preço em USD',
                    data: prices,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } catch (error) {
        console.error('Erro ao carregar gráfico:', error);
        modalLoading.textContent = 'Erro ao carregar gráfico.';
    }
}

// CORRIGIDO: updateCryptoPrices agora verifica se data é array e trata rate limit
async function updateCryptoPrices() {
    if (trackedCryptos.length === 0) {
        cryptoList.innerHTML = '';
        if (cryptoUpdateInterval) {
            clearInterval(cryptoUpdateInterval);
            cryptoUpdateInterval = null;
        }
        return;
    }

    // Atualiza a cotação do dólar (usa cache se necessário)
    await fetchUsdToBrl();

    try {
        const ids = trackedCryptos.join(',');
        const endpoint = encodeURIComponent(`coins/markets?vs_currency=usd&ids=${ids}`);
        const response = await fetch(`/api/coingecko?endpoint=${endpoint}`);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();

        console.log('Dados de crypto recebidos:', data); // Debug

        // Verifica se tem erro de rate limit
        if (data.status && data.status.error_code) {
            console.warn('Rate limit da CoinGecko atingido para cryptos');
            return; // Mantém os dados atuais
        }

        // CORRIGIDO: Verifica se data é um array antes de usar forEach
        if (!Array.isArray(data)) {
            throw new Error('Resposta da API não é um array');
        }

        cryptoList.innerHTML = '';
        data.forEach(displayCrypto);
    } catch (error) {
        console.error("Erro ao buscar preços de criptomoedas:", error);
        errorMessageEl.textContent = "Erro ao atualizar preços de criptomoedas.";
        setTimeout(() => {
            errorMessageEl.textContent = '';
        }, 5000);
    }
}

function saveTrackedCryptos() {
    localStorage.setItem('trackedCryptos', JSON.stringify(trackedCryptos));
}

function loadTrackedCryptos() {
    const saved = localStorage.getItem('trackedCryptos');
    if (saved) {
        try {
            trackedCryptos = JSON.parse(saved);
            // Garantir que seja um array
            if (!Array.isArray(trackedCryptos)) {
                trackedCryptos = [];
            }
            if (trackedCryptos.length > 0) {
                updateCryptoPrices();
                if (cryptoUpdateInterval) clearInterval(cryptoUpdateInterval);
                cryptoUpdateInterval = setInterval(updateCryptoPrices, 60000);
            }
        } catch (e) {
            console.error('Erro ao carregar cryptos salvas:', e);
            trackedCryptos = [];
        }
    }
}

// Eventos das criptos
addCryptoBtn.addEventListener('click', addCrypto);
cryptoInput.addEventListener('input', populateCryptoSuggestions);
cryptoInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') addCrypto();
});

closeModal.addEventListener('click', () => cryptoModal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === cryptoModal) cryptoModal.style.display = 'none';
});

// Add Chart.js CDN
const chartScript = document.createElement('script');
chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
document.head.appendChild(chartScript);
