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
    { name: 'Beautiful Instrumental', url: 'http://s3.voscast.com:10038/stream' },    
    { name: 'Best New Age', url: 'http://104.153.209.180:8000/;stream.mp3' },
    { name: 'Cinemix', url: 'https://kathy.torontocast.com:1825/stream' },
    { name: 'Esotérica Fm', url: 'https://canais.esoterica.fm.br/8002/stream/1/' },
    { name: 'Beautiful Instrumental Channel', url: 'http://hydra.cdnstream.com/1822_128' },
    { name: 'Beautiful Music', url: 'https://radio.streemlion.com:1665/stream?' },
    { name: 'Chinese Music', url: 'https://radio.chinesemusicworld.com/chinesemusic.mp3' },
    { name: 'Lynn Classical', url: 'http://radio.linn.co.uk:8004/autodj' },    
    { name: 'Soothing Radio', url: 'http://193.111.125.15:8010/soothingradio' },
    { name: 'Enigmatic 3', url: 'http://radio.enigmatic.su:8050/radio' },
    { name: 'Actions', url: 'https://lizeradio.com/webplayer/actions.php' },
    { name: 'Relaxation Island', url: 'http://198.178.123.5:7932/' },
    { name: 'Enigmatic Immersion', url: 'http://radio.enigmatic.su:8040/radio' },
    { name: 'Radio Caprice', url: 'http://79.120.77.11:8002/newage' },    
    { name: 'Instrumental Hits Radio', url: 'http://162.244.81.98:8130/listen' },
    { name: 'Instrumentales de Oro', url: 'https://stream-169.zeno.fm/0anygxe1b1duv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiIwYW55Z3hlMWIxZHV2IiwiaG9zdCI6InN0cmVhbS0xNjkuemVuby5mbSIsInJ0dGwiOjUsImp0aSI6ImRtclRid01uUzJDT2JLaVFkX0RlTHciLCJpYXQiOjE3NTc0NDQyOTMsImV4cCI6MTc1NzQ0NDM1M30.ZhQSv9jIwupM4LOmL9v568unimsZ8YMsWByPTxEFk1A' },
    { name: 'Instrumental Hits', url: 'https://panel.retrolandigital.com:8130/listen'},
    { name: 'Instrumental Radio', url: ' https://stream-155.zeno.fm/3hhp1s4z8zhvv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiIzaGhwMXM0ejh6aHZ2IiwiaG9zdCI6InN0cmVhbS0xNTUuemVuby5mbSIsInJ0dGwiOjUsImp0aSI6ImJTM0JaSFB0UU9tWmEwbHNhbkk2dEEiLCJpYXQiOjE3NTc0NDUxNzgsImV4cCI6MTc1NzQ0NTIzOH0.hPkcj23aGyJMEj6nBGhq0M8O-9SmgxoosG6kklPPjEk'},
    { name: 'Easy Instrumentals', url: 'https://nl4.mystreaming.net/uber/easyinstrumentals/icecast.audio'},

   
];

let allAvailableCryptos = [];
let trackedCryptos = [];
let cryptoUpdateInterval;
// Proxy para contornar o CORS da CoinGecko
const PROXY_URL = "https://api.allorigins.win/raw?url=";

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

let isPlaying = false;
let timeInterval;

let usdToBrl = 5.25; // valor padrão, será atualizado

async function fetchUsdToBrl() {
    try {
        const res = await fetch(PROXY_URL + encodeURIComponent('https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=brl'));

        if (!res.ok) throw new Error(`API de cotação retornou status ${res.status}`);
        const data = await res.json();
        if (data && data.usd && data.usd.brl) {
            usdToBrl = parseFloat(data.usd.brl);
        } else {
            throw new Error('Formato de resposta da CoinGecko inválido.');
        }
    } catch (error) {
        console.error("Falha ao buscar cotação do dólar, usando valor de fallback.", error);
        usdToBrl = 5.25; // fallback
    }
}


// Atualiza a cotação do dólar antes de buscar os preços das criptos
async function updateCryptoPrices() {
    if (trackedCryptos.length === 0) {
        cryptoList.innerHTML = '';
        if (cryptoUpdateInterval) {
            clearInterval(cryptoUpdateInterval);
            cryptoUpdateInterval = null;
        }
        return;
    }

    // Atualiza a cotação do dólar
    await fetchUsdToBrl();

    try {
        const ids = trackedCryptos.join(',');
        const response = await fetch(`${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=${ids}`);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();

        cryptoList.innerHTML = '';
        data.forEach(displayCrypto);
    } catch (error) {
        console.error("Erro ao buscar preços de criptomoedas:", error);
        errorMessageEl.textContent = "Erro ao atualizar preços de criptomoedas.";
        setTimeout(() => errorMessageEl.textContent = '', 5000);
    }
}

// --- NOVO: atualizar dólar sozinho a cada 30s
setInterval(fetchUsdToBrl, 30000);


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

// Vamos criar um array de colunas que repete as cores 3 e 4
const columns = [
  'blue',    // Coluna 1
  'green',   // Coluna 2
  'teal',    // Coluna 3
  'orange',  // Coluna 4
  'pink',    // Coluna 5 (repetindo a 3)
  'yellow'   // Coluna 6 (repetindo a 4)
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
    
    // Define qual coluna original usar para cálculo (3 ou 4)
    let sourceColumnIndex;
    if (i === 4) sourceColumnIndex = 2; // Coluna 5 usa o comportamento da coluna 3
    else if (i === 5) sourceColumnIndex = 3; // Coluna 6 usa o comportamento da coluna 4
    else sourceColumnIndex = i; // Colunas 1, 2, 3 e 4 usam seu próprio comportamento
    
    const scheme = colorSchemes[column.dataset.colorScheme];

    // Cálculo da intensidade média usando a coluna de referência
    const bufferLen = dataArray.length;
    const start = Math.floor((sourceColumnIndex / columnsEl.length) * bufferLen);
    const end = Math.floor(((sourceColumnIndex + 1) / columnsEl.length) * bufferLen);
    
    let sum = 0;
    for (let j = start; j < end; j++) sum += dataArray[j];
    let value = sum / (end - start);
    
    // Amplificação geral para melhor visualização
    value = Math.min(255, value * 1.15);

    const activeBoxes = Math.round((value / 255) * boxes.length);

    // Acende apenas os boxes correspondentes à intensidade
    boxes.forEach((box, j) => {
      if (j < activeBoxes) {
        box.style.backgroundColor = scheme[j % scheme.length];
      } else {
        box.style.backgroundColor = '#000000ff'; // fundo escuro das caixas apagadas
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

// Criar colunas ao carregar
createColumns();
window.addEventListener('resize', () => {
  createColumns();
});


// Função para detectar cores escuras
function isDarkColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
}

// Função para mudar cor do texto de todos os elementos filhos, exceto inputs, buttons, selects
function setTextColor(container, color) {
    const textColor = isDarkColor(color) ? '#fff' : '#000';
    container.style.setProperty('color', textColor, 'important');
    container.querySelectorAll('*').forEach(el => {
        // Aplica cor em todos, exceto elementos interativos
        if (
            el.tagName !== 'INPUT' &&
            el.tagName !== 'BUTTON' &&
            el.tagName !== 'SELECT' &&
            el.tagName !== 'TEXTAREA' &&
            el.tagName !== 'OPTION'
        ) {
            el.style.setProperty('color', textColor, 'important');
        }
        // Para inputs, ajusta cor e fundo
        if (el.tagName === 'INPUT') {
            el.style.setProperty('color', textColor, 'important');
            el.style.setProperty('background-color', isDarkColor(color) ? '#222' : '#fff', 'important');
            el.style.caretColor = textColor;
        }
    });
    // Corrige cor dos botões de tema e background
    themeBtn.style.setProperty('color', textColor, 'important');
    backgroundBtn.style.setProperty('color', textColor, 'important');
}

// Containers internos
const containerColors = [
    '#f5f5f5', '#e0f7fa', '#fff3e0', '#f3e5f5', '#fce4ec',
    '#e8f5e9', '#2c3e50', '#34495e', '#7f8c8d', '#8e44ad', '#c0392b'
];
let currentContainerColor = 0;

// Fundo externo
const backgroundColors = [
    '#f0f8ff', '#fffaf0', '#fdf5e6', '#e6ffe6', '#fff0f5',
    '#f5f5dc', '#1c1c1c', '#2f2f2f', '#3b3b3b', '#0d47a1', '#4a148c'
];
let currentBackgroundColor = 0;

// Botões
const backgroundBtn = document.getElementById('background-btn');


// Evento para mudar cor dos containers internos
themeBtn.addEventListener('click', () => {
    const color = containerColors[currentContainerColor];
    appContainer.style.backgroundColor = color;
    setTextColor(appContainer, color);
    currentContainerColor = (currentContainerColor + 1) % containerColors.length;
});

// Evento para mudar cor do fundo externo
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
        // Primeiro, obter o ID da cidade via API de "current weather"
        const geoApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=19323201f1e62b73c148d04a7a229454&units=metric&lang=pt`;
        const geoResponse = await fetch(geoApiUrl);
        if (!geoResponse.ok) {
            if (geoResponse.status === 401) throw new Error('Chave de API inválida. Verifique sua API key.');
            throw new Error('Erro ao buscar informações da cidade.');
        }
        const geoData = await geoResponse.json();
        const { id: cityId, name, sys: { country }, timezone, coord } = geoData;

        // Agora, obter forecast de 5 dias (a cada 3h)
        const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?id=${cityId}&appid=19323201f1e62b73c148d04a7a229454&units=metric&lang=pt`;
        const forecastResponse = await fetch(forecastApiUrl);
        if (!forecastResponse.ok) throw new Error('Erro ao buscar dados do clima.');
        const forecastData = await forecastResponse.json();

        hideLoading();

        // Temperatura atual
        const currentTemp = geoData.main.temp;
        cityNameEl.textContent = `${name}, ${country}`;
        temperatureEl.textContent = `Temperatura atual: ${Math.round(currentTemp)}°C`;

        // Hora local baseada no timezone da cidade
        updateTimeWithOffset(timezone);
        if (timeInterval) clearInterval(timeInterval);
        timeInterval = setInterval(() => updateTimeWithOffset(timezone), 1000);

        // Previsão horária (próximas 12 entradas de 3h)
        displayHourlyForecastOpenWeather(forecastData.list, timezone);

        // Previsão diária (usando os próximos 3 dias)
        displayDailyForecastOpenWeather(forecastData.list);

        // Mostrar mapa
   showMap(coord.lat, coord.lon, name);


        resultContainer.classList.remove('hidden');

        // Depois de mostrar temperatura:
setTextColor(appContainer, appContainer.style.backgroundColor || containerColors[currentContainerColor]);
    } catch (error) {
        showError(error.message);
        console.error(error);
    }
}


// Atualiza hora local baseado no offset do timezone em segundos
function updateTimeWithOffset(timezoneOffsetSec) {
    const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
    const localTime = new Date(utc + timezoneOffsetSec * 1000);
    const timeString = localTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    localTimeEl.textContent = `Hora Local: ${timeString}`;
}

// Previsão horária
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

        // Quebrar descrição em palavras e colocar cada palavra em uma linha
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


// Previsão diária (resumida)
function displayDailyForecastOpenWeather(list) {
    forecastContainer.innerHTML = '';
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Criar objeto com max/min por dia
    const daily = {};
    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toISOString().slice(0, 10);
        if (!daily[dayKey]) daily[dayKey] = { temps: [], weatherIds: [] };
        daily[dayKey].temps.push(item.main.temp);
        daily[dayKey].weatherIds.push(item.weather[0].id);
    });

    const days = Object.keys(daily).slice(1, 4); // Próximos 3 dias
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

// Converte códigos do OpenWeather para emojis e texto
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




function updateTimeWithOffset(offsetSeconds) {
    try {
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const localDate = new Date(utc + (offsetSeconds * 1000));
        const timeString = localDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        localTimeEl.textContent = `Hora Local: ${timeString}`;
    } catch {
        localTimeEl.textContent = 'Hora Local: Indisponível';
    }
}



// --- NOVA FUNÇÃO DE MAPA ---

async function showMap(lat, lon, city) {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;

    if (mapInstance) {
        mapInstance.remove();
    }

    // Cria o mapa sem controles de atribuição
    mapInstance = L.map('map', { attributionControl: false }).setView([lat, lon], 12);

    // Camada base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(mapInstance);

    try {
        // CORRIGIDO: Busca global pela cidade, sem travar no Brasil
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
            
            // Ajusta o zoom para caber no contorno
            mapInstance.fitBounds(geoLayer.getBounds());
            mapInstance.setZoom(9);
        } else {
            console.warn("Nenhum polígono encontrado para a cidade, usando apenas o ponto.");
            mapInstance.setView([lat, lon], 12);
            // Marca o ponto da cidade
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

async function loadAvailableCryptos() {
    try {
        const response = await fetch(PROXY_URL + encodeURIComponent(`${COINGECKO_API_URL}/coins/list`));

        if (!response.ok) throw new Error('Não foi possível carregar a lista de criptomoedas.');
        const data = await response.json();
        allAvailableCryptos = data;
    } catch (error) {
        console.error("Erro ao buscar criptomoedas:", error);
        errorMessageEl.textContent = "Erro ao carregar lista de criptomoedas.";
    }
}

function populateCryptoSuggestions() {
    cryptoDatalist.innerHTML = '';
    const inputValue = cryptoInput.value.trim().toLowerCase();

    if (inputValue.length < 2) return;

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
        const response = await fetch(`${COINGECKO_API_URL}/coins/${cryptoId}/market_chart?vs_currency=usd&days=${currentChartDays}`);
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

async function updateCryptoPrices() {
    if (trackedCryptos.length === 0) {
        cryptoList.innerHTML = '';
        if (cryptoUpdateInterval) {
            clearInterval(cryptoUpdateInterval);
            cryptoUpdateInterval = null;
        }
        return;
    }

    // Atualiza a cotação do dólar antes de buscar os preços das criptos
    await fetchUsdToBrl();

    try {
        const ids = trackedCryptos.join(',');
        const response = await fetch(PROXY_URL + encodeURIComponent(`${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=${ids}`));

        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();

        cryptoList.innerHTML = '';
        data.forEach(displayCrypto);
    } catch (error) {
        console.error("Erro ao buscar preços de criptomoedas:", error);
        errorMessageEl.textContent = "Erro ao atualizar preços de criptomoedas.";
        setTimeout(() => {
            errorMessageEl.textContent = '';
        }, 5000); // A chamada recursiva foi removida, pois o setInterval já cuida da próxima atualização.
    }
}

function saveTrackedCryptos() {
    localStorage.setItem('trackedCryptos', JSON.stringify(trackedCryptos));
}

function loadTrackedCryptos() {
    const saved = localStorage.getItem('trackedCryptos');
    if (saved) {
        trackedCryptos = JSON.parse(saved);
        if (trackedCryptos.length > 0) {
            updateCryptoPrices();
            if (cryptoUpdateInterval) clearInterval(cryptoUpdateInterval);
            cryptoUpdateInterval = setInterval(updateCryptoPrices, 60000);
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
