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
    { name: 'Scalla Instrumental SP', url: '/api/proxy?url=' + encodeURIComponent('https://s01.svrdedicado.org:6782/stream?1788582683900') },
    { name: 'Beautiful Instrumental', url: '/api/proxy?url=' + encodeURIComponent('https://hydra.cdnstream.com/1822_128') },
    { name: 'Enigmatic 3', url: '/api/proxy?url=' + encodeURIComponent('http://radio.enigmatic.su:8050/radio') },
    { name: 'Actions', url: '/api/proxy?url=' + encodeURIComponent('https://lizeradio.com/webplayer/actions.php') },
    { name: 'Relaxation Island', url: '/api/proxy?url=' + encodeURIComponent('http://198.178.123.5:7932/') },
    { name: 'Enigmatic Immersion', url: '/api/proxy?url=' + encodeURIComponent('http://radio.enigmatic.su:8040/radio') },
    { name: 'Radio Caprice', url: '/api/proxy?url=' + encodeURIComponent('http://79.120.77.11:8002/newage') },    
    { name: 'Instrumental Hits', url: '/api/proxy?url=' + encodeURIComponent('http://162.244.81.98:8130/listen') },
    { name: 'Soma FM', url: '/api/proxy?url=' + encodeURIComponent('https://ice2.somafm.com/thistle-64-aac') },
    { name: 'FM Premium', url: '/api/proxy?url=' + encodeURIComponent('http://cast4.audiostream.com.br:8663/mp3?1788555790061') },
    { name: 'Melodia Instrumental', url: '/api/proxy?url=' + encodeURIComponent('https://servidor29.brlogic.com:8578/live?1788556000340') },
    { name: 'Web Rádio E5', url: '/api/proxy?url=' + encodeURIComponent('https://paineldj6.com.br:20131/stream?1788556084556') },
    { name: 'Rádio Sol Maior Instrumental', url: '/api/proxy?url=' + encodeURIComponent('http://server02.ouvir.radio.br:8045/stream?1788556175088') },
    { name: 'Surfer Network', url: '/api/proxy?url=' + encodeURIComponent('https://stream-177.surfernetwork.com/9nm481kbya0uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiI5bm00ODFrYnlhMHV2IiwiaG9zdCI6InN0cmVhbS0xNzcuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiJsV1lyWUlVNVFudUxCcnlJeGs4eHhRIiwiaWF0IjoxNzg4NTU2MzEzLCJleHAiOjE3ODg1NTYzNzN9.CXL5ZlMfLQ7V0gOzmNv6hR6HD-q9Ns4-xqMqqDmqdkc&1788556313391') },
    { name: 'Adoradores Instrumental', url: '/api/proxy?url=' + encodeURIComponent('https://stm11.painelcast.com:7530/stream?1788556431582') },
    { name: 'Suave Excalla', url: '/api/proxy?url=' + encodeURIComponent('http://server02.ouvir.radio.br:8045/stream?1788582818637') },
    { name: 'Radio Nos', url: '/api/proxy?url=' + encodeURIComponent('https://nos.radio.br/stream/2/;?1788583074916') },
    { name: 'Esotérica FM', url: '/api/proxy?url=' + encodeURIComponent('https://radio.esoterica.fm.br:8002/stream?1788583215514') },
    { name: 'Esotérica FM Mantras', url: '/api/proxy?url=' + encodeURIComponent('https://radio.esoterica.fm.br:8010/stream?1788583366712') },
    { name: 'Naphtali Web', url: '/api/proxy?url=' + encodeURIComponent('https://servidor28-5.brlogic.com:8272/live?1788583515523') },
    { name: 'Anjo de Luz', url: '/api/proxy?url=' + encodeURIComponent('https://servidor26.brlogic.com:8196/live?1788583657889') },
    { name: 'Blog Lyriah', url: '/api/proxy?url=' + encodeURIComponent('https://centova.svdns.com.br:20290/live?1788583727918') },
    { name: 'The Kyoto Connection', url: '/api/proxy?url=' + encodeURIComponent('https://server.laradio.online:59009/live') },
    { name: 'J Pop Sakura', url: '/api/proxy?url=' + encodeURIComponent('https://quincy.torontocast.com:2070/;') },
    { name: 'BOX : Japan City Pop', url: '/api/proxy?url=' + encodeURIComponent('https://stream-286.surfernetwork.com/x5bwgjxv68xvv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJ4NWJ3Z2p4djY4eHZ2IiwiaG9zdCI6InN0cmVhbS0yODYuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiJDRXBkV1ZUUlJDbVRGLWdEMkMyQVl3IiwiaWF0IjoxNzg4NTg1MzAwLCJleHAiOjE3ODg1ODUzNjB9.CpWIXUpp0XcdUQemd3GeLuOcayWltrU_KIok-P41RCU&_cb=1788442502910') },
    { name: 'Hear me FM', url: '/api/proxy?url=' + encodeURIComponent('https://radio.hearme.fm:8158/stream') }

    
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




const RAPIDAPI_HOST = "shazam-core.p.rapidapi.com";
const identifyBtn = document.getElementById('identify-song-btn');
const songResultEl = document.getElementById('song-result-el');

// ============================================
// CONFIGURAÇÕES
// ============================================
const CAPTURE_DURATION = 4000;      // 4 segundos (ideal para a API)
const TARGET_SAMPLE_RATE = 44100;   // Taxa exigida pela API
const TARGET_CHANNELS = 1;          // Mono funciona melhor

if (identifyBtn) {
    identifyBtn.addEventListener('click', async () => {
        console.log("=== IDENTIFICAÇÃO INICIADA ===");

        // Validações
        if (!isPlaying || !audioPlayer.src) {
            songResultEl.textContent = "❌ Dê o play em uma rádio primeiro!";
            return;
        }
        if (!audioCtx) {
            songResultEl.textContent = "❌ Aguarde o áudio conectar e tente de novo.";
            return;
        }

        // Garante que o AudioContext esteja rodando
        if (audioCtx.state === "suspended") {
            await audioCtx.resume();
        }

        // ⚠️ AVISO: se o audioCtx foi criado com sampleRate diferente de 44100,
        // o ideal é recriá-lo com { sampleRate: 44100 } na inicialização do app
        if (audioCtx.sampleRate !== TARGET_SAMPLE_RATE) {
            console.warn(`Sample rate atual: ${audioCtx.sampleRate}Hz. Ideal: 44100Hz. Considere recriar o AudioContext.`);
        }

        identifyBtn.disabled = true;
        songResultEl.textContent = "👂 Ouvindo a rádio por 4 segundos...";

        try {
            // 1. Cria o destino de stream (captura o áudio que passa pelo analyser)
            const destination = audioCtx.createMediaStreamDestination();

            // Conecta o analyser ao destino de captura
            // (assumindo que 'analyser' já está na cadeia do áudio da rádio)
            analyser.connect(destination);

            // 2. Usa MediaRecorder para gravar o stream (muito mais confiável que ScriptProcessor)
            const mediaRecorder = new MediaRecorder(destination.stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            // 3. Inicia a gravação
            mediaRecorder.start(100); // coleta a cada 100ms

            // Aguarda a duração definida
            await new Promise(resolve => setTimeout(resolve, CAPTURE_DURATION));

            // Para a gravação
            mediaRecorder.stop();

            // Aguarda o blob final
            const audioBlob = await new Promise((resolve) => {
                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    resolve(blob);
                };
            });

            // Desconecta para não vazar memória
            analyser.disconnect(destination);

            console.log("Blob capturado:", audioBlob.size, "bytes");

            // 4. Converte para WAV 44100Hz Mono (a API exige WAV ou MP3)
            const wavBlob = await convertToWav(audioBlob, TARGET_SAMPLE_RATE, TARGET_CHANNELS);

            console.log("WAV final:", wavBlob.size, "bytes");

            if (wavBlob.size > 2 * 1024 * 1024) {
                throw new Error("Arquivo muito grande para a API (>2MB)");
            }

            songResultEl.textContent = "🔍 Consultando o Shazam...";

            // 5. Envia para o backend
            const formData = new FormData();
            formData.append("file", wavBlob, "sample.wav");

            const response = await fetch("/api/shazam", {
                method: "POST",
                body: formData
            });

            const responseText = await response.text();
            console.log("HTTP status:", response.status);
            console.log("Resposta:", responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error("Resposta inválida do servidor");
            }

            if (data && data.track) {
                mostrarResultadoShazam(data.track);
            } else {
                songResultEl.textContent = "🤷 Não foi possível identificar a música. Tente em outro momento da música (evite locução/áudio de propaganda).";
            }

        } catch (err) {
            console.error("ERRO:", err);
            songResultEl.textContent = `❌ ${err.message || "Erro ao identificar a música."}`;
        } finally {
            identifyBtn.disabled = false;
        }
    });
}

// ============================================
// CONVERTE BLOB (webm) PARA WAV 44100Hz MONO
// ============================================
async function convertToWav(audioBlob, targetSampleRate, targetChannels) {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Resample para a taxa desejada usando OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(
        targetChannels,
        audioBuffer.duration * targetSampleRate,
        targetSampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();

    const resampledBuffer = await offlineCtx.startRendering();

    // Converte para WAV
    return audioBufferToWav(resampledBuffer);
}

// ============================================
// GERA BLOB WAV A PARTIR DE AudioBuffer
// ============================================
function audioBufferToWav(audioBuffer) {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // Escreve cabeçalho WAV
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);         // length = 16
    setUint16(1);          // PCM
    setUint16(numOfChan);
    setUint32(audioBuffer.sampleRate);
    setUint32(audioBuffer.sampleRate * 2 * numOfChan); // avg bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16);         // 16-bit
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // chunk length

    // Interleave channels
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }

    while (pos < audioBuffer.length) {
        for (let i = 0; i < numOfChan; i++) {
            let sample = Math.max(-1, Math.min(1, channels[i][pos]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(44 + offset, sample, true);
            offset += 2;
        }
        pos++;
    }

    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }
    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}
