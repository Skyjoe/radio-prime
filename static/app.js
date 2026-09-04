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

// === CONFIGURAÇÃO DO SERVIDOR ===
// Detecta automaticamente se está em desenvolvimento ou produção
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
    { name: 'Instrumentales de Oro', url: '/api/proxy?url=' + encodeURIComponent('https://stream-169.zeno.fm/0anygxe1b1duv') },
    { name: 'Instrumental Hits', url: '/api/proxy?url=' + encodeURIComponent('https://panel.retrolandigital.com:8130/listen') },
    { name: 'Instrumental Radio', url: '/api/proxy?url=' + encodeURIComponent('https://stream-155.zeno.fm/3hhp1s4z8zhvv') },
    { name: 'Easy Instrumentals', url: '/api/proxy?url=' + encodeURIComponent('https://nl4.mystreaming.net/uber/easyinstrumentals/icecast.audio') }
];

let allAvailableCryptos = [];
let trackedCryptos = [];
let cryptoUpdateInterval;

let isPlaying = false;
let timeInterval;

let usdToBrl = 5.25;
let lastUsdBrlFetch = 0;
const USD_BRL_CACHE_TIME = 300000; // 5 minutos


// Função para normalizar URLs - CORRIGIDA DEFINITIVAMENTE
function normalizeUrl(url) {
    if (!url) return url;
    url = url.trim();
    
    // Se já começa com /, http:// ou https://, retorna como está
    if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Se começa com api/ (sem barra), adiciona a barra
    if (url.startsWith('api/')) {
        return '/' + url;
    }
    
    return 'http://' + url;
}

// Função para mostrar erros da rádio
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
        // Garante que a URL comece com / para ser relativa ao domínio
        let url = selectedUrl;
        if (!url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = '/' + url;
        }
        
        // Se a URL começa com http://, converte para https:// em produção
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

// Buscar cotação USD/BRL
// Buscar cotação USD/BRL
async function fetchUsdToBrl() {
  try {
    const now = Date.now();
    if (now - lastUsdBrlFetch < USD_BRL_CACHE_TIME) {
      console.log('Usando cotação USD/BRL em cache:', usdToBrl);
      return usdToBrl;
    }

    console.log('Buscando cotação USD/BRL diretamente da Binance...');
    
    // Chamada direta à Binance pelo navegador (sem passar pelo servidor Flask/Vercel)
    const brlResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL');
    
    if (!brlResponse.ok) {
      throw new Error(`HTTP error! status: ${brlResponse.status}`);
    }
    
    const brlData = await brlResponse.json();
    
    if (brlData && brlData.price) {
      usdToBrl = parseFloat(brlData.price);
      lastUsdBrlFetch = now;
      console.log('Cotação USD/BRL atualizada com sucesso:', usdToBrl);
      return usdToBrl;
    } else {
      console.warn('Formato de resposta inválido da Binance:', brlData);
      return usdToBrl;
    }
  } catch (error) {
    console.error('Falha ao buscar cotação do dólar:', error);
    // Em caso de falha de rede, usa o valor atual/padrão que já estava na memória
    return usdToBrl;
  }
}

// Carregar lista de criptomoedas
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
        } else {
            throw new Error('Formato de resposta inválido');
        }
    } catch (error) {
        console.error("Erro ao buscar criptomoedas:", error);
        allAvailableCryptos = [];
        if (errorMessageEl) {
            errorMessageEl.textContent = "Erro ao carregar lista de criptomoedas. Tente novamente.";
            setTimeout(() => {
                errorMessageEl.textContent = '';
            }, 5000);
        }
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
    if (!inputValue) {
        if (errorMessageEl) errorMessageEl.textContent = 'Por favor, digite o nome ou símbolo de uma criptomoeda.';
        return;
    }

    if (!Array.isArray(allAvailableCryptos) || allAvailableCryptos.length === 0) {
        if (errorMessageEl) errorMessageEl.textContent = 'Lista de criptomoedas ainda não carregada. Aguarde...';
        loadAvailableCryptos();
        return;
    }

    console.log('Buscando criptomoeda:', inputValue);
    
    let selectedCoin = null;
    
    const match = inputValue.match(/^(.+?)\s*\((.+?)\)\s*$/);
    
    if (match) {
        const namePart = match[1].trim();
        const symbolPart = match[2].trim().toUpperCase();
        
        console.log(`Buscando: NOME="${namePart}", SÍMBOLO="${symbolPart}"`);
        
        selectedCoin = allAvailableCryptos.find(coin => {
            const coinName = coin.name.trim();
            const coinSymbol = coin.symbol ? coin.symbol.toUpperCase() : '';
            return coinName === namePart && coinSymbol === symbolPart;
        });
        
        if (!selectedCoin) {
            selectedCoin = allAvailableCryptos.find(coin => {
                const coinSymbol = coin.symbol ? coin.symbol.toUpperCase() : '';
                return coinSymbol === symbolPart;
            });
        }
        
        if (!selectedCoin) {
            selectedCoin = allAvailableCryptos.find(coin => {
                return coin.name.trim() === namePart;
            });
        }
    } else {
        const searchTerm = inputValue.toLowerCase();
        
        selectedCoin = allAvailableCryptos.find(coin => 
            coin.symbol && coin.symbol.toLowerCase() === searchTerm
        );
        
        if (!selectedCoin) {
            selectedCoin = allAvailableCryptos.find(coin => 
                coin.name.toLowerCase() === searchTerm
            );
        }
        
        if (!selectedCoin) {
            selectedCoin = allAvailableCryptos.find(coin => 
                coin.name.toLowerCase().startsWith(searchTerm) ||
                (coin.symbol && coin.symbol.toLowerCase().startsWith(searchTerm))
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
            if (errorMessageEl) {
                errorMessageEl.textContent = `✅ ${selectedCoin.name} (${selectedCoin.symbol ? selectedCoin.symbol.toUpperCase() : 'N/A'}) adicionada!`;
                setTimeout(() => {
                    errorMessageEl.textContent = '';
                }, 3000);
            }
            console.log('✅ Criptomoeda adicionada:', selectedCoin.name, 'ID:', selectedCoin.id);
        } else {
            if (errorMessageEl) errorMessageEl.textContent = `${selectedCoin.name} já está na sua lista.`;
        }
    } else {
        if (errorMessageEl) errorMessageEl.textContent = `Criptomoeda "${inputValue}" não encontrada.`;
        console.log('❌ Criptomoeda não encontrada:', inputValue);
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
    
    // Aceita tanto priceUsd quanto current_price
    const priceVal = priceUsd !== undefined ? priceUsd : current_price;
    const numericPrice = parseFloat(priceVal);

    if (isNaN(numericPrice)) {
        console.warn(`Preço não disponível para ${name}`);
        return;
    }

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

// Buscar dados para o gráfico
async function showCryptoChart(cryptoId, cryptoName, cryptoSymbol) {
    currentModalCryptoId = cryptoId;
    currentModalCryptoName = cryptoName;
    currentModalCryptoSymbol = cryptoSymbol;

    modalTitle.textContent = `${cryptoName} (${cryptoSymbol ? cryptoSymbol.toUpperCase() : ''}) - Gráfico`;
    modalLoading.classList.remove('hidden');
    cryptoModal.style.display = 'block';

    if (chartInstance) chartInstance.destroy();

    try {
        const baseUrl = isLocal ? 'http://localhost:5000' : '';
        
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${cryptoSymbol.toUpperCase()}USDT&interval=1h&limit=24`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do gráfico');
        }
        
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
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#ffffff'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#ffffff'
                            }
                        }
                    }
                }
            });
        } else {
            throw new Error('Dados do gráfico não disponíveis');
        }
    } catch (error) {
        console.error('Erro ao carregar gráfico:', error);
        modalLoading.textContent = 'Erro ao carregar gráfico.';
        setTimeout(() => {
            modalLoading.textContent = 'Tente novamente mais tarde.';
        }, 3000);
    }
}


// Atualizar preços das criptomoedas diretamente pelo navegador
async function updateCryptoPrices() {
    console.log('🔄 Atualizando preços para a lista:', trackedCryptos);

    if (trackedCryptos.length === 0) {
        cryptoList.innerHTML = '';
        if (cryptoUpdateInterval) {
            clearInterval(cryptoUpdateInterval);
            cryptoUpdateInterval = null;
        }
        return;
    }

    try {
        const results = [];

        for (const cryptoId of trackedCryptos) {
            // Busca as informações locais do ativo
            const cryptoInfo = allAvailableCryptos.find(c => c.id === cryptoId);
            
            if (!cryptoInfo) {
                console.warn(`⚠️ Informações do ID "${cryptoId}" não encontradas em allAvailableCryptos.`);
                continue;
            }

            const rawSymbol = cryptoInfo.symbol ? cryptoInfo.symbol.toUpperCase() : '';
            if (!rawSymbol) continue;

            // Determina o par comercial na Binance
            let binanceSymbol = `${rawSymbol}USDT`;
            if (rawSymbol === 'USDT') {
                binanceSymbol = 'USDTBRL';
            }

            try {
                console.log(`📡 Consultando Binance para ${cryptoInfo.name} (${binanceSymbol})...`);
                const resp = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
                
                if (resp.ok) {
                    const priceData = await resp.json();
                    console.log(`✅ Preço recebido para ${cryptoInfo.name}:`, priceData.price);
                    results.push({
                        id: cryptoId,
                        name: cryptoInfo.name,
                        symbol: cryptoInfo.symbol,
                        priceUsd: priceData.price
                    });
                } else {
                    console.error(`❌ Erro HTTP na Binance para ${binanceSymbol}:`, resp.status);
                }
            } catch (e) {
                console.error(`❌ Erro ao buscar preço de ${cryptoId}:`, e);
            }
        }

        console.log('🎨 Desenhando moedas na tela:', results);
        
        // Limpa e redesenha a lista com os resultados válidos
        cryptoList.innerHTML = '';
        results.forEach(displayCrypto);

    } catch (error) {
        console.error("Erro geral em updateCryptoPrices:", error);
        if (errorMessageEl) {
            errorMessageEl.textContent = "Erro ao atualizar preços de criptomoedas.";
            setTimeout(() => { if (errorMessageEl) errorMessageEl.textContent = ''; }, 5000);
        }
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
            if (!Array.isArray(trackedCryptos)) {
                trackedCryptos = [];
            }
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
        const baseUrl = isLocal ? 'http://localhost:5000' : '';
        const url = `${baseUrl}/api/nominatim?q=${encodeURIComponent(city)}`;
        
        const res = await fetch(url);
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

// ===== BACKGROUND ESTILO EQUALIZADOR =====
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

// ===== FUNÇÕES DE TEMA =====
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

 // --- NOVA LÓGICA DE INICIALIZAÇÃO DE TEMA CLARO ---
    // Força o container a iniciar com a primeira cor clara da lista (#f5f5f5)
    currentContainerColor = 0; //
    const initialContainerColor = containerColors[currentContainerColor]; //
    appContainer.style.backgroundColor = initialContainerColor; //
    setTextColor(appContainer, initialContainerColor); //
    currentContainerColor = 1; // Prepara o índice para o próximo clique do botão

    // Força o fundo da página (body) a iniciar com a primeira cor clara da lista (#f0f8ff)
    currentBackgroundColor = 0; //
    const initialBgColor = backgroundColors[currentBackgroundColor]; //
    document.body.style.backgroundColor = initialBgColor; //
    setTextColor(document.body, initialBgColor); //
    currentBackgroundColor = 1; // Prepara o índice para o próximo clique do botão

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    await fetchUsdToBrl();
    populateStations();
    audioPlayer.volume = volumeSlider.value;
    loadAvailableCryptos();
    loadTrackedCryptos();

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

// Add Chart.js CDN
const chartScript = document.createElement('script');
chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
document.head.appendChild(chartScript);
