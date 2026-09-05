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

// --- referência ao mapa
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

// === CONFIGURAÇÃO DO SERVIDOR ===
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SERVER_URL = isLocal ? 'http://localhost:5000' : '';

// Radio Player Elements
const stationSelect = document.getElementById('station-select');
const playPauseBtn = document.getElementById('play-pause-btn');
const volumeSlider = document.getElementById('volume-slider');
const audioPlayer = document.getElementById('audio-player');

const radioStations = [
    { name: 'Selecione uma rádio...', url: '' },
    { name: 'Radio Gold Instrumental', url: '/api/proxy?url=' + encodeURIComponent('https://centova2.svdns.com.br:20038/stream') },
    { name: 'Beautiful Instrumental', url: '/api/proxy?url=' + encodeURIComponent('http://s3.voscast.com:10038/stream') },
    { name: 'Best New Age', url: '/api/proxy?url=' + encodeURIComponent('http://104.153.209.180:8000/;stream.mp3') },
    { name: 'Cinemix', url: '/api/proxy?url=' + encodeURIComponent('https://kathy.torontocast.com:1825/stream') },
    { name: 'Esotérica Fm', url: '/api/proxy?url=' + encodeURIComponent('https://canais.esoterica.fm.br/8002/stream/1/') },
    { name: 'Beautiful Instrumental Channel', url: '/api/proxy?url=' + encodeURIComponent('https://hydra.cdnstream.com/1822_128') },
    { name: 'Beautiful Music', url: '/api/proxy?url=' + encodeURIComponent('https://radio.streemlion.com:1665/stream?') },
    { name: 'Chinese Music', url: '/api/proxy?url=' + encodeURIComponent('https://radio.chinesemusicworld.com/chinesemusic.mp3') },
    { name: 'Lynn Classical', url: '/api/proxy?url=' + encodeURIComponent('https://radio.linn.co.uk:8004/autodj') },    
    { name: 'Soothing Radio', url: '/api/proxy?url=' + encodeURIComponent('http://193.111.125.15:8010/soothingradio') },
    { name: 'Enigmatic 3', url: '/api/proxy?url=' + encodeURIComponent('http://radio.enigmatic.su:8050/radio') },
    { name: 'Actions', url: '/api/proxy?url=' + encodeURIComponent('https://lizeradio.com/webplayer/actions.php') },
    { name: 'Relaxation Island', url: '/api/proxy?url=' + encodeURIComponent('http://198.178.123.5:7932/') },
    { name: 'Enigmatic Immersion', url: '/api/proxy?url=' + encodeURIComponent('http://radio.enigmatic.su:8040/radio') },
    { name: 'Radio Caprice', url: '/api/proxy?url=' + encodeURIComponent('http://79.120.77.11:8002/newage') },    
    { name: 'Instrumental Hits Radio', url: '/api/proxy?url=' + encodeURIComponent('http://162.244.81.98:8130/listen') },
    { name: 'SomaFM - ThistleRadio (Celta e Instrumental)', url: '/api/proxy?url=' + encodeURIComponent('https://ice2.somafm.com/thistle-64-aac') },
    { name: 'FM Premium (Instrumental e Orquestrada)', url: '/api/proxy?url=' + encodeURIComponent('http://cast4.audiostream.com.br:8663/mp3?1788555790061') },
    { name: 'Rádio Melodia Instrumental', url: '/api/proxy?url=' + encodeURIComponent('https://servidor29.brlogic.com:8578/live?1788556000340') },
    { name: 'Web Rádio E5 (Ambient e Calma)', url: '/api/proxy?url=' + encodeURIComponent('https://paineldj6.com.br:20131/stream?1788556084556') },
    { name: 'Rádio Sol Maior Instrumental', url: '/api/proxy?url=' + encodeURIComponent('http://server02.ouvir.radio.br:8045/stream?1788556175088') },
    { name: 'SurferNetwork - Relaxing Audio Stream', url: '/api/proxy?url=' + encodeURIComponent('https://stream-177.surfernetwork.com/9nm481kbya0uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiI5bm00ODFrYnlhMHV2IiwiaG9zdCI6InN0cmVhbS0xNzcuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiJsV1lyWUlVNVFudUxCcnlJeGs4eHhRIiwiaWF0IjoxNzg4NTU2MzEzLCJleHAiOjE3ODg1NTYzNzN9.CXL5ZlMfLQ7V0gOzmNv6hR6HD-q9Ns4-xqMqqDmqdkc&1788556313391') },
    { name: 'Adoradores Instrumental', url: '/api/proxy?url=' + encodeURIComponent('https://stm11.painelcast.com:7530/stream?1788556431582') }
];

let allAvailableCryptos = [];
let trackedCryptos = [];
let cryptoUpdateInterval;

let isPlaying = false;
let timeInterval;

let usdToBrl = 5.25;
let lastUsdBrlFetch = 0;
const USD_BRL_CACHE_TIME = 300000;

function normalizeUrl(url) {
    if (!url) return url;
    url = url.trim();
    if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('api/')) {
        return '/' + url;
    }
    return 'http://' + url;
}

function showRadioError(message) {
    if (errorMessageEl) {
        errorMessageEl.textContent = '📻 ' + message;
        setTimeout(() => {
            if (errorMessageEl.textContent === '📻 ' + message) {
                errorMessageEl.textContent = '';
            }
        }, 5000);
    }
}

function populateStations() {
    radioStations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.url;
        option.textContent = station.name;
        stationSelect.appendChild(option);
    });
}

function togglePlayPause() {
    const src = audioPlayer.src;
    if (src && src !== window.location.href && src !== '') {
        if (isPlaying) {
            audioPlayer.pause();
            playPauseBtn.classList.remove('pause-icon');
            playPauseBtn.classList.add('play-icon');
            isPlaying = false;
        } else {
            audioPlayer.play().catch(e => {
                console.error("Error playing audio:", e);
                if (e.name === 'AbortError' || e.name === 'NotSupportedError') {
                    audioPlayer.load();
                    setTimeout(() => {
                        audioPlayer.play().catch(err => {
                            console.error("Second attempt failed:", err);
                            showRadioError("Não foi possível reproduzir esta rádio.");
                            isPlaying = false;
                            playPauseBtn.classList.remove('pause-icon');
                            playPauseBtn.classList.add('play-icon');
                        });
                    }, 500);
                }
            });
            playPauseBtn.classList.remove('play-icon');
            playPauseBtn.classList.add('pause-icon');
            isPlaying = true;
        }
    } else {
        showRadioError("Selecione uma rádio primeiro.");
    }
}

function handleStationChange() {
    const selectedUrl = stationSelect.value;
    if (selectedUrl) {
        let url = selectedUrl;
        if (!url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = '/' + url;
        }
        if (!isLocal && url.startsWith('http://')) {
            url = url.replace('http://', 'https://');
        }
        
        console.log('Tocando:', url);
        
        if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
        }
        
        audioPlayer.src = url;
        audioPlayer.load();
        
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                playPauseBtn.classList.remove('play-icon');
                playPauseBtn.classList.add('pause-icon');
            }).catch(e => {
                console.error("Error playing audio:", e);
                showRadioError("Não foi possível conectar à rádio. Verifique sua conexão.");
                playPauseBtn.classList.remove('pause-icon');
                playPauseBtn.classList.add('play-icon');
                isPlaying = false;
            });
        }
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

audioPlayer.addEventListener('error', (e) => {
    console.error('Erro no áudio:', e);
    if (isPlaying) {
        isPlaying = false;
        playPauseBtn.classList.remove('pause-icon');
        playPauseBtn.classList.add('play-icon');
    }
});

audioPlayer.addEventListener('stalled', () => {
    console.warn('Stream travado, tentando recarregar...');
    if (audioPlayer.src && isPlaying) {
        if (audioPlayer.readyState > 0) {
            audioPlayer.load();
            setTimeout(() => {
                audioPlayer.play().catch(e => console.error('Falha ao retomar:', e));
            }, 1000);
        }
    }
});

// ===== FUNÇÕES DE CRIPTOMOEDAS =====

async function fetchUsdToBrl() {
  try {
    const now = Date.now();
    if (now - lastUsdBrlFetch < USD_BRL_CACHE_TIME) {
      console.log('Usando cotação USD/BRL em cache:', usdToBrl);
      return usdToBrl;
    }

    console.log('Buscando cotação USD/BRL diretamente da Binance...');
    const brlResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL');
    
    if (!brlResponse.ok) {
      throw new Error(`HTTP error! status: ${brlResponse.status}`);
    }
    
    const brlData = await brlResponse.json();
    if (brlData && brlData.price) {
      usdToBrl = parseFloat(brlData.price);
      lastUsdBrlFetch = now;
      console.log('Cotação USD/BRL updated:', usdToBrl);
      return usdToBrl;
    }
    return usdToBrl;
  } catch (error) {
    console.error('Falha ao buscar cotação do dólar:', error);
    return usdToBrl;
  }
}

async function loadAvailableCryptos() {
    try {
        console.log('Carregando lista de criptomoedas...');
        const baseUrl = isLocal ? 'http://localhost:5000' : '';
        const response = await fetch(`${baseUrl}/api/crypto?endpoint=assets?limit=2000`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar lista');
        }
        
        const data = await response.json();
        if (data && data.data && Array.isArray(data.data)) {
            allAvailableCryptos = data.data;
            console.log(`${allAvailableCryptos.length} criptomoedas carregadas`);
            
            if (trackedCryptos.length > 0) {
                updateCryptoPrices();
            }
        }
    } catch (error) {
        console.error("Erro ao buscar criptomoedas:", error);
        allAvailableCryptos = [];
    }
}

function populateCryptoSuggestions() {
    cryptoDatalist.innerHTML = '';
    const inputValue = cryptoInput.value.trim().toLowerCase();

    if (inputValue.length < 1 || !Array.isArray(allAvailableCryptos)) return;

    const matchingCoins = allAvailableCryptos.filter(coin =>
        (coin.name && coin.name.toLowerCase().includes(inputValue)) ||
        (coin.symbol && coin.symbol.toLowerCase().includes(inputValue))
    ).slice(0, 50);

    matchingCoins.forEach(coin => {
        const option = document.createElement('option');
        const symbolDisplay = coin.symbol ? coin.symbol.toUpperCase() : 'N/A';
        option.value = `${coin.name} (${symbolDisplay})`;
        cryptoDatalist.appendChild(option);
    });
}

function addCrypto() {
    if (errorMessageEl) errorMessageEl.textContent = '';
    const inputValue = cryptoInput.value.trim();
    if (!inputValue) return;

    if (!Array.isArray(allAvailableCryptos) || allAvailableCryptos.length === 0) {
        loadAvailableCryptos();
        return;
    }

    let selectedCoin = null;
    const match = inputValue.match(/^(.+?)\s*\((.+?)\)\s*$/);
    
    if (match) {
        const namePart = match[1].trim();
        const symbolPart = match[2].trim().toUpperCase();
        
        selectedCoin = allAvailableCryptos.find(coin => {
            const coinName = coin.name.trim();
            const coinSymbol = coin.symbol ? coin.symbol.toUpperCase() : '';
            return coinName === namePart && coinSymbol === symbolPart;
        });
    } else {
        const searchTerm = inputValue.toLowerCase();
        selectedCoin = allAvailableCryptos.find(coin => 
            coin.symbol && coin.symbol.toLowerCase() === searchTerm
        ) || allAvailableCryptos.find(coin => 
            coin.name.toLowerCase() === searchTerm
        );
    }

    if (selectedCoin) {
        const selectedId = selectedCoin.id;
        if (!trackedCryptos.includes(selectedId)) {
            trackedCryptos.push(selectedId);
            saveTrackedCryptos();
            updateCryptoPrices();
            cryptoInput.value = "";
        }
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
    const { id, name, symbol, priceUsd, current_price } = data;
    const priceVal = priceUsd !== undefined ? priceUsd : current_price;
    const numericPrice = parseFloat(priceVal);

    if (isNaN(numericPrice)) return;

    let item = document.getElementById(`crypto-${id}`);
    if (!item) {
        item = document.createElement('div');
        item.id = `crypto-${id}`;
        item.classList.add('crypto-item');
        item.style.cursor = 'pointer';
        cryptoList.appendChild(item);
    }

    const isUSDT = symbol && symbol.toUpperCase() === "USDT";
    const precoFinal = isUSDT ? numericPrice * usdToBrl : numericPrice;
    const simbolo = isUSDT ? "R$" : "$";
    const symbolDisplay = symbol ? symbol.toUpperCase() : 'N/A';

    item.innerHTML = `
        <button class="remove-crypto-btn" title="Remover">&times;</button>
        <h4>${name} <span>(${symbolDisplay})</span></h4>
        <p>${simbolo} ${precoFinal.toFixed(2)}</p>
    `;

    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
    item = newItem;

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
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${cryptoSymbol.toUpperCase()}USDT&interval=1h&limit=24`);
        if (!response.ok) throw new Error('Erro ao buscar dados do gráfico');
        
        const data = await response.json();
        if (data && Array.isArray(data)) {
            const prices = data.map(item => parseFloat(item[4]));
            const labels = data.map(item => {
                const date = new Date(item[0]);
                return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#ffffff' } } },
                    scales: { x: { ticks: { color: '#ffffff' } }, y: { ticks: { color: '#ffffff' } } }
                }
            });
        }
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

    if (allAvailableCryptos.length === 0) {
        console.log('🔄 Aguardando catálogo de criptomoedas carregar antes de atualizar preços...');
        return;
    }

    try {
        const results = [];
        for (const cryptoId of trackedCryptos) {
            const cryptoInfo = allAvailableCryptos.find(c => c.id === cryptoId);
            if (!cryptoInfo) continue;

            const rawSymbol = cryptoInfo.symbol ? cryptoInfo.symbol.toUpperCase() : '';
            if (!rawSymbol) continue;

            let binanceSymbol = `${rawSymbol}USDT`;
            if (rawSymbol === 'USDT') binanceSymbol = 'USDTBRL';

            try {
                const resp = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
                if (resp.ok) {
                    const priceData = await resp.json();
                    results.push({
                        id: cryptoId,
                        name: cryptoInfo.name,
                        symbol: cryptoInfo.symbol,
                        priceUsd: priceData.price
                    });
                }
            } catch (e) {
                console.error(`Erro ao buscar preço de ${cryptoId}:`, e);
            }
        }
        
        cryptoList.innerHTML = '';
        results.forEach(displayCrypto);
    } catch (error) {
        console.error("Erro geral em updateCryptoPrices:", error);
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
            if (!Array.isArray(trackedCryptos)) trackedCryptos = [];
            if (trackedCryptos.length > 0) {
                updateCryptoPrices();
                if (cryptoUpdateInterval) clearInterval(cryptoUpdateInterval);
                cryptoUpdateInterval = setInterval(updateCryptoPrices, 120000);
            }
        } catch (e) {
            console.error('Erro ao carregar cryptos salvas:', e);
            trackedCryptos = [];
        }
    }
}

addCryptoBtn.addEventListener('click', addCrypto);
cryptoInput.addEventListener('input', populateCryptoSuggestions);
cryptoInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') addCrypto();
});

closeModal.addEventListener('click', () => cryptoModal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === cryptoModal) cryptoModal.style.display = 'none';
});

// ===== FUNÇÕES DE CLIMA =====

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

function showLoading() { loader.classList.remove('hidden'); }
function hideLoading() { loader.classList.add('hidden'); }
function showError(message) { hideLoading(); errorMessageEl.textContent = message; }

async function getWeatherAndTime(cityName = null) {
    const savedCity = localStorage.getItem("defaultCity");
    const city = cityName || savedCity || "Jundiaí";

    clearInfo();
    showLoading();

    try {
        const geoApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=19323201f1e62b73c148d04a7a229454&units=metric&lang=pt`;
        const geoResponse = await fetch(geoApiUrl);
        if (!geoResponse.ok) throw new Error('Erro ao buscar informações da cidade.');
        
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
        
        const currentBg = appContainer.style.backgroundColor || containerColors[currentContainerColor];
        setTextColor(appContainer, currentBg);
    } catch (error) {
        showError(error.message);
    }
}

function updateTimeWithOffset(timezoneOffsetSec) {
    const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
    const localTime = new Date(utc + timezoneOffsetSec * 1000);
    localTimeEl.textContent = `Hora Local: ${localTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
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
        hourBox.innerHTML = `<p class="hour">${hour}</p><p class="icon">${icon}</p><p class="desc">${formattedText}</p><p class="temp">${temp}°C</p>`;
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
        const { icon, text } = getWeatherIconOpenWeather(dayData.weatherIds[Math.floor(dayData.weatherIds.length / 2)]);
        const dayOfWeek = weekdays[new Date(dayKey + 'T00:00:00').getUTCDay()];

        const forecastDayEl = document.createElement('div');
        forecastDayEl.classList.add('forecast-day');
        forecastDayEl.innerHTML = `<p class="day">${dayOfWeek}</p><p class="icon">${icon}</p><p class="desc">${text}</p><p class="temps">${Math.round(minTemp)}° / ${Math.round(maxTemp)}°</p>`;
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
    return { icon: '☁️', text: 'Nublado' };
}

async function showMap(lat, lon, city) {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    if (mapInstance) mapInstance.remove();

    mapInstance = L.map('map', { attributionControl: false }).setView([lat, lon], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&polygon_geojson=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
        const data = await res.json();

        if (data.length > 0 && data[0].geojson) {
            const geoLayer = L.geoJSON(data[0].geojson, {
                style: { color: "red", weight: 2, fillColor: "rgba(255,0,0,0.2)", fillOpacity: 0.3 }
            }).addTo(mapInstance);
            mapInstance.fitBounds(geoLayer.getBounds());
            mapInstance.setZoom(10);
        } else {
            L.marker([lat, lon]).addTo(mapInstance).bindPopup(city).openPopup();
        }
    } catch (err) {
        console.error("Erro ao carregar o contorno do mapa:", err);
        mapInstance.setView([lat, lon], 12);
        L.marker([lat, lon]).addTo(mapInstance).bindPopup(city).openPopup();
    }
    
    setTimeout(() => { mapInstance.invalidateSize(); }, 300);
}

// ===== BACKGROUND ESTILOS EQUALIZADOR =====
const colorSchemes = {
  blue: ['#001F3F', '#003366', '#004C99', '#0066CC', '#0080FF', '#3399FF'],
  green: ['#004D1A', '#006622', '#008033', '#009933', '#00B33C', '#00CC44'],
  pink: ['#330033', '#4D004D', '#660066', '#800080', '#990099', '#B300B3'],
  teal: ['#003333', '#004D4D', '#006666', '#008080', '#009999', '#00B3B3'],
  orange: ['#331100', '#662200', '#993300', '#CC4400', '#FF5500', '#FF7733'],
  yellow: ['#332600', '#664D00', '#997300', '#CC9900', '#FFBF00', '#FFD633']
};

const columns = ['blue', 'green', 'teal', 'orange', 'pink', 'yellow'];
const numColumns = columns.length;

function createColumns() {
  const wrapper = document.getElementById('wrapper');
  if(!wrapper) return;
  wrapper.innerHTML = '';
  wrapper.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
  
  columns.forEach(colorName => {
    const column = document.createElement('div');
    column.className = 'column';
    column.dataset.colorScheme = colorName;

    const boxCount = Math.ceil(window.innerHeight / 16);
    for (let i = 0; i < boxCount; i++) {
      column.appendChild(document.createElement('div')).className = 'box';
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
    let sourceColumnIndex = (i === 4) ? 2 : (i === 5) ? 3 : i;
    const scheme = colorSchemes[column.dataset.colorScheme];

    const bufferLen = dataArray.length;
    const start = Math.floor((sourceColumnIndex / columnsEl.length) * bufferLen);
    const end = Math.floor(((sourceColumnIndex + 1) / columnsEl.length) * bufferLen);
    
    let sum = 0;
    for (let j = start; j < end; j++) sum += dataArray[j];
    let value = Math.min(255, (sum / (end - start)) * 1.15);
    const activeBoxes = Math.round((value / 255) * boxes.length);

    boxes.forEach((box, j) => {
      box.style.backgroundColor = (j < activeBoxes) ? scheme[j % scheme.length] : '#000000ff';
    });
  });
}

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
window.addEventListener('resize', createColumns);

// ===== FUNÇÕES DE TEMA =====
function isDarkColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return ((r * 299 + g * 587 + b * 114) / 1000) < 128;
}

function setTextColor(container, color) {
    if (!container) return;
    const textColor = isDarkColor(color) ? '#fff' : '#000';
    container.style.setProperty('color', textColor, 'important');
    container.querySelectorAll('*').forEach(el => {
        if (!['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'OPTION'].includes(el.tagName)) {
            el.style.setProperty('color', textColor, 'important');
        }
        if (el.tagName === 'INPUT') {
            el.style.setProperty('color', textColor, 'important');
            el.style.setProperty('background-color', isDarkColor(color) ? '#222' : '#fff', 'important');
            el.style.caretColor = textColor;
        }
    });
    themeBtn.style.setProperty('color', textColor, 'important');
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

themeBtn.addEventListener('click', () => {
    const color = containerColors[currentContainerColor];
    appContainer.style.backgroundColor = color;
    setTextColor(appContainer, color);
    currentContainerColor = (currentContainerColor + 1) % containerColors.length;
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    await fetchUsdToBrl();
    populateStations();
    audioPlayer.volume = volumeSlider.value;
    loadAvailableCryptos();
    loadTrackedCryptos();

    // --- TEMA CLARO INICIAL FORÇADO ---
    currentContainerColor = 0;
    const initialContainerColor = containerColors[currentContainerColor];
    appContainer.style.backgroundColor = initialContainerColor;
    setTextColor(appContainer, initialContainerColor);
    currentContainerColor = 1;

    currentBackgroundColor = 0;
    const initialBgColor = backgroundColors[currentBackgroundColor];
    document.body.style.backgroundColor = initialBgColor;
    setTextColor(document.body, initialBgColor);
    currentBackgroundColor = 1;

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('chart-time-btn')) {
            document.querySelectorAll('.chart-time-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentChartDays = parseFloat(e.target.dataset.days);
            if (currentModalCryptoId) {
                showCryptoChart(currentModalCryptoId, currentModalCryptoName, currentModalCryptoSymbol);
            }
        }
    });

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




// Referências dos novos elementos HTML de identificação de músicas

const identifyBtn = document.getElementById('identify-song-btn');
const songResultEl = document.getElementById('song-result-el'); 
const RAPIDAPI_KEY = "d5d4636078msh5f548e19051a72p15bba8jsn97ddac3c4604"; 
const RAPIDAPI_HOST = "shazam-core.p.rapidapi.com";

if (identifyBtn) {
    identifyBtn.addEventListener('click', async () => {
        console.log("=== IDENTIFICAÇÃO INICIADA ===");
        console.log("isPlaying:", isPlaying);
        console.log("audioPlayer.src:", audioPlayer.src);
        console.log("audioCtx:", audioCtx);
        console.log("audioCtx.state:", audioCtx?.state);
        console.log("analyser:", analyser);

        if (!isPlaying || !audioPlayer.src) {
            songResultEl.textContent = "❌ Dê o play em uma rádio primeiro!";
            return;
        }

        if (!audioCtx) {
            songResultEl.textContent = "❌ Aguarde o áudio conectar e tente de novo.";
            return;
        }

        identifyBtn.disabled = true;
        songResultEl.textContent = "👂 Ouvindo a rádio por 7 segundos...";

        try {
            if (audioCtx.state === "suspended") {
                await audioCtx.resume();
            }

            console.log("AudioContext:", audioCtx.state);

            const destination = audioCtx.createMediaStreamDestination();

            console.log("MediaStreamDestination criado:", destination);
            console.log("Stream:", destination.stream);
            console.log("Tracks:", destination.stream.getAudioTracks());

            analyser.connect(destination);
            console.log("Analyser conectado ao destination.");

            const source = audioCtx.createMediaStreamSource(destination.stream);
            const captureNode = audioCtx.createScriptProcessor(4096, 2, 2);
            const audioData = [];

            captureNode.onaudioprocess = (event) => {
                const inputBuffer = event.inputBuffer;
                const channelCount = inputBuffer.numberOfChannels;
                const channelData = [];

                for (let channel = 0; channel < channelCount; channel++) {
                    channelData.push(
                        new Float32Array(
                            inputBuffer.getChannelData(channel)
                        )
                    );
                }

                audioData.push(channelData);
            };

            source.connect(captureNode);
            captureNode.connect(audioCtx.destination);

            console.log("Captura PCM iniciada.");

            await new Promise(resolve => {
                setTimeout(resolve, 7000);
            });

            console.log("=== CAPTURA FINALIZADA ===");

            source.disconnect();
            captureNode.disconnect();
            analyser.disconnect(destination);

            console.log("Blocos PCM capturados:", audioData.length);

            if (audioData.length === 0) {
                throw new Error("Nenhum dado de áudio foi capturado.");
            }

            const wavBlob = createWavBlob(
                audioData,
                audioCtx.sampleRate
            );

            console.log("WAV criado:", wavBlob);
            console.log("Tamanho:", wavBlob.size);
            console.log("Tipo:", wavBlob.type);

            songResultEl.textContent = "🔍 Consultando o Shazam...";

            const formData = new FormData();

            formData.append(
                "file",
                wavBlob,
                "sample.wav"
            );

            try {
                console.log("Enviando áudio para o Shazam...");
                console.log(
                    "Endpoint:",
                    `https://${RAPIDAPI_HOST}/v1/tracks/recognize`
                );

                const response = await fetch(
                    `https://${RAPIDAPI_HOST}/v1/tracks/recognize`,
                    {
                        method: "POST",
                        headers: {
                            "X-RapidAPI-Key": RAPIDAPI_KEY,
                            "X-RapidAPI-Host": RAPIDAPI_HOST
                        },
                        body: formData
                    }
                );

                console.log("HTTP status:", response.status);

                const responseText = await response.text();

                let data;

                try {
                    data = JSON.parse(responseText);
                } catch {
                    console.error("Resposta não é JSON.");
                    data = null;
                }

                console.log(
                    "Shazam:",
                    data?.track?.title,
                    "-",
                    data?.track?.subtitle
                );

                if (data && data.track) {
                    mostrarResultadoShazam(data.track);
                } else {
                    songResultEl.textContent =
                        "🤷 Não foi possível identificar a música.";
                }

            } catch (err) {
                console.error("ERRO AO CONSULTAR SHAZAM:", err);

                songResultEl.textContent =
                    "❌ Falha ao consultar o servidor.";

            } finally {
                identifyBtn.disabled = false;
            }

        } catch (err) {
            console.error("ERRO NA CAPTURA:", err);

            songResultEl.textContent =
                "❌ Erro ao capturar o áudio.";

            identifyBtn.disabled = false;
        }
    });
}


// ========================================================================
// MOSTRA O RESULTADO DO SHAZAM
// ========================================================================

function mostrarResultadoShazam(track) {
    const titulo =
        track.title || "Música desconhecida";

    const artista =
        track.subtitle || "Artista desconhecido";

    const imagem =
        track.images?.coverarthq ||
        track.images?.coverart ||
        "";

    const providers =
        track.hub?.providers || [];

    const spotify =
        providers.find(
            provider => provider.type === "SPOTIFY"
        );

    const youtube =
        providers.find(
            provider => provider.type === "YOUTUBEMUSIC"
        );

    const deezer =
        providers.find(
            provider => provider.type === "DEEZER"
        );

    songResultEl.innerHTML = "";

    const container =
        document.createElement("div");

    container.className =
        "shazam-result";

    if (imagem) {
        const img =
            document.createElement("img");

        img.src = imagem;
        img.alt = `${titulo} - ${artista}`;
        img.className = "shazam-cover";

        container.appendChild(img);
    }

    const info =
        document.createElement("div");

    info.className =
        "shazam-info";

    const titleElement =
        document.createElement("div");

    titleElement.className =
        "shazam-title";

    titleElement.textContent =
        `🎵 ${titulo}`;

    const artistElement =
        document.createElement("div");

    artistElement.className =
        "shazam-artist";

    artistElement.textContent =
        artista;

    info.appendChild(titleElement);
    info.appendChild(artistElement);

    const metadata =
        track.sections?.[0]?.metadata;

    if (metadata) {
        let album = "";
        let ano = "";

        for (const item of metadata) {
            if (item.title === "Album") {
                album = item.text || "";
            }

            if (item.title === "Released") {
                ano = item.text || "";
            }
        }

        if (album || ano) {
            const metaElement =
                document.createElement("div");

            metaElement.className =
                "shazam-meta";

            if (album && ano) {
                metaElement.textContent =
                    `${album} · ${ano}`;
            } else {
                metaElement.textContent =
                    album || ano;
            }

            info.appendChild(metaElement);
        }
    }

    const buttons =
        document.createElement("div");

    buttons.className =
        "shazam-buttons";

    // ============================================================
    // SPOTIFY
    // ============================================================

    if (spotify) {
        const action =
            spotify.actions?.[0];

        if (action?.uri) {
            const button =
                document.createElement("a");

            const searchText =
                encodeURIComponent(
                    `${titulo} ${artista}`
                );

            button.href =
                `https://open.spotify.com/search/${searchText}`;

            button.target = "_blank";
            button.rel = "noopener noreferrer";
            button.className =
                "shazam-service-btn spotify-btn";

            button.textContent =
                "🎧 Spotify";

            buttons.appendChild(button);
        }
    }

    // ============================================================
    // YOUTUBE MUSIC
    // ============================================================

    if (youtube) {
        const action =
            youtube.actions?.[0];

        if (action?.uri) {
            const button =
                document.createElement("a");

            button.href =
                action.uri;

            button.target = "_blank";
            button.rel = "noopener noreferrer";
            button.className =
                "shazam-service-btn youtube-btn";

            button.textContent =
                "▶️ YouTube Music";

            buttons.appendChild(button);
        }
    }

    // ============================================================
    // DEEZER
    // ============================================================

    if (deezer) {
        const action =
            deezer.actions?.[0];

        if (action?.uri) {
            const button =
                document.createElement("a");

            const searchText =
                encodeURIComponent(
                    `${titulo} ${artista}`
                );

            button.href =
                `https://www.deezer.com/search/${searchText}`;

            button.target = "_blank";
            button.rel = "noopener noreferrer";
            button.className =
                "shazam-service-btn deezer-btn";

            button.textContent =
                "🎵 Deezer";

            buttons.appendChild(button);
        }
    }

    if (buttons.children.length > 0) {
        info.appendChild(buttons);
    }

    container.appendChild(info);
    songResultEl.appendChild(container);
}


// ========================================================================
// CONVERTE OS DADOS PCM CAPTURADOS EM UM ARQUIVO WAV
// ========================================================================

function createWavBlob(audioData, sampleRate) {
    const channelCount =
        audioData[0].length;

    let totalSamples = 0;

    for (const block of audioData) {
        totalSamples += block[0].length;
    }

    console.log("Canais:", channelCount);
    console.log("Sample rate:", sampleRate);
    console.log("Total de amostras:", totalSamples);

    const channels =
        Math.min(channelCount, 2);

    const bytesPerSample = 2;

    const dataSize =
        totalSamples *
        channels *
        bytesPerSample;

    const buffer =
        new ArrayBuffer(44 + dataSize);

    const view =
        new DataView(buffer);

    // ============================================================
    // CABEÇALHO WAV
    // ============================================================

    writeString(view, 0, "RIFF");

    view.setUint32(
        4,
        36 + dataSize,
        true
    );

    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");

    view.setUint32(
        16,
        16,
        true
    );

    view.setUint16(
        20,
        1,
        true
    );

    view.setUint16(
        22,
        channels,
        true
    );

    view.setUint32(
        24,
        sampleRate,
        true
    );

    view.setUint32(
        28,
        sampleRate *
        channels *
        bytesPerSample,
        true
    );

    view.setUint16(
        32,
        channels *
        bytesPerSample,
        true
    );

    view.setUint16(
        34,
        16,
        true
    );

    writeString(view, 36, "data");

    view.setUint32(
        40,
        dataSize,
        true
    );

    // ============================================================
    // DADOS PCM
    // ============================================================

    let offset = 44;

    for (const block of audioData) {
        const samples =
            block[0].length;

        for (let i = 0; i < samples; i++) {
            for (
                let channel = 0;
                channel < channels;
                channel++
            ) {
                let sample =
                    block[channel][i];

                sample =
                    Math.max(
                        -1,
                        Math.min(1, sample)
                    );

                const intSample =
                    sample < 0
                        ? sample * 0x8000
                        : sample * 0x7FFF;

                view.setInt16(
                    offset,
                    intSample,
                    true
                );

                offset += 2;
            }
        }
    }

    return new Blob(
        [buffer],
        {
            type: "audio/wav"
        }
    );
}


// ========================================================================
// ESCREVE TEXTO NO CABEÇALHO WAV
// ========================================================================

function writeString(view, offset, text) {
    for (
        let i = 0;
        i < text.length;
        i++
    ) {
        view.setUint8(
            offset + i,
            text.charCodeAt(i)
        );
    }
}
