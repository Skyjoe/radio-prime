from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests
import logging
import json
import time
import urllib.parse
import os
import uuid
import time
import traceback
import re
from groq import Groq

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

# Binance Public API
BINANCE_PUBLIC_API = 'https://api.binance.com/api/v3'

# Lista de criptomoedas suportadas
SUPPORTED_CRYPTOS = [
    {'id': 'bitcoin', 'name': 'Bitcoin', 'symbol': 'BTC'},
    {'id': 'ethereum', 'name': 'Ethereum', 'symbol': 'ETH'},
    {'id': 'cardano', 'name': 'Cardano', 'symbol': 'ADA'},
    {'id': 'binancecoin', 'name': 'BNB', 'symbol': 'BNB'},
    {'id': 'solana', 'name': 'Solana', 'symbol': 'SOL'},
    {'id': 'ripple', 'name': 'XRP', 'symbol': 'XRP'},
    {'id': 'dogecoin', 'name': 'Dogecoin', 'symbol': 'DOGE'},
    {'id': 'polkadot', 'name': 'Polkadot', 'symbol': 'DOT'},
    {'id': 'chainlink', 'name': 'Chainlink', 'symbol': 'LINK'},
    {'id': 'tether', 'name': 'Tether', 'symbol': 'USDT'},
    {'id': 'litecoin', 'name': 'Litecoin', 'symbol': 'LTC'},
    {'id': 'bitcoin-cash', 'name': 'Bitcoin Cash', 'symbol': 'BCH'},
    {'id': 'stellar', 'name': 'Stellar', 'symbol': 'XLM'},
    {'id': 'vechain', 'name': 'VeChain', 'symbol': 'VET'},
    {'id': 'filecoin', 'name': 'Filecoin', 'symbol': 'FIL'},
    {'id': 'theta', 'name': 'Theta', 'symbol': 'THETA'},
    {'id': 'ethereum-classic', 'name': 'Ethereum Classic', 'symbol': 'ETC'},
    {'id': 'neo', 'name': 'Neo', 'symbol': 'NEO'},
    {'id': 'eos', 'name': 'EOS', 'symbol': 'EOS'},
    {'id': 'monero', 'name': 'Monero', 'symbol': 'XMR'}
]

SYMBOL_MAP = {
    'bitcoin': 'BTCUSDT',
    'ethereum': 'ETHUSDT',
    'cardano': 'ADAUSDT',
    'binancecoin': 'BNBUSDT',
    'solana': 'SOLUSDT',
    'ripple': 'XRPUSDT',
    'dogecoin': 'DOGEUSDT',
    'polkadot': 'DOTUSDT',
    'chainlink': 'LINKUSDT',
    'tether': 'USDTBRL',
    'litecoin': 'LTCUSDT',
    'bitcoin-cash': 'BCHUSDT',
    'stellar': 'XLMUSDT',
    'vechain': 'VETUSDT',
    'filecoin': 'FILUSDT',
    'theta': 'THETAUSDT',
    'ethereum-classic': 'ETCUSDT',
    'neo': 'NEOUSDT',
    'eos': 'EOSUSDT',
    'monero': 'XMRUSDT'
}


# Configuração das chaves
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") # Cole sua chave direto aqui se preferir
NEWSDATA_API_KEY = os.environ.get("NEWSDATA_KEY")

# Inicializa o cliente oficial da Groq
client_groq = Groq(api_key=GROQ_API_KEY)

def simple_local_summary(title, description, max_words=50):
    base = f"{title}. {description or ''}".strip()
    words = base.split()
    if len(words) <= max_words:
        out = " ".join(words)
    else:
        out = " ".join(words[:max_words])
    if not re.search(r"[.!?]$", out):
        out += "."
    return "\u2022 " + out

@app.route('/api/noticias', methods=['GET'])
def obter_noticias():
    url_news = "https://newsdata.io"
    filtros = {
        "apikey": NEWSDATA_API_KEY,
        "country": "br",
        "language": "pt",
        "category": "politics,business,technology,world,science"
    }

    try:
        response = requests.get(url_news, params=filtros, timeout=10)
        if response.status_code != 200:
            return jsonify({"status": "error", "message": f"Erro NewsData: {response.text}"}), response.status_code

        response.encoding = 'utf-8'
        data = response.json()

        if "results" in data and len(data["results"]) > 0:
            lote_filtrado = []

            for n in data["results"]:
                titulo_lower = n.get("title", "").lower() if n.get("title") else ""
                desc_lower = n.get("description", "").lower() if n.get("description") else ""

                if any(termo in titulo_lower or termo in desc_lower for termo in [
                    "cupom", "shopee", "oferta", "exclusiva para assinantes", "assinante"
                ]):
                    continue

                if not n.get("description") or "acesse o portal" in desc_lower or "acesse o link" in desc_lower:
                    n["description"] = "Acompanhe os desdobramentos e informações desta manchete jornalística de última hora."
                else:
                    descricao_limpa = n["description"].replace("[...]", "").strip()
                    palavras = descricao_limpa.split()
                    if palavras and palavras[-1].lower() in ["as", "os", "a", "o", "com", "de", "e", "em", "para", "por"]:
                        descricao_limpa = " ".join(palavras[:-1]) + "..."
                    n["description"] = descricao_limpa

                lote_filtrado.append(n)
                if len(lote_filtrado) == 7:  # Puxa 7 notícias para equilibrar a cota diária da Groq
                    break

            # Processamento individual via SDK oficial da Groq
            for index, noticia in enumerate(lote_filtrado):
                titulo = noticia.get("title", "").strip()
                descricao = noticia.get("description", "").strip()

                request_id = str(uuid.uuid4())
                print(f"[{request_id}] Groq Cloud - Item {index + 1}/{len(lote_filtrado)}")

                try:
                    # Chamada usando a biblioteca oficial testada por você
                    completion = client_groq.chat.completions.create(
                        model="openai/gpt-oss-20b",  # Perfeito para resumos leves. Se quiser mudar, use "openai/gpt-oss-120b"
                        messages=[
                            {
                                "role": "system",
                                "content": (
                                    "Você é um jornalista profissional. Escreva um único parágrafo de até 50 palavras "
                                    "em português sintetizando o texto enviado. Integre o título na PRIMEIRA FRASE. "
                                    "Comece o parágrafo estritamente com '• ' e termine com ponto final."
                                )
                            },
                            {
                                "role": "user",
                                "content": f"Título: {titulo}\nTexto: {descricao}"
                            }
                        ],
                        temperature=0.2,
                        max_completion_tokens=120
                    )

                    resumo_ia = completion.choices[0].message.content.strip()
                    
                    if resumo_ia:
                        if not resumo_ia.startswith("•") and not resumo_ia.startswith("\u2022"):
                            resumo_ia = "• " + resumo_ia
                        noticia["description"] = resumo_ia
                        continue

                    noticia["description"] = simple_local_summary(titulo, descricao, max_words=50)

                except Exception as item_error:
                    print(f"[{request_id}] Erro Groq no item {index + 1}: {item_error}")
                    noticia["description"] = simple_local_summary(titulo, descricao, max_words=50)

            data["results"] = lote_filtrado

        return jsonify(data), 200

    except Exception as e:
        print(f"Erro Crítico na Rota de Notícias: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500








@app.route('/api/crypto', methods=['GET', 'OPTIONS'])
def crypto_proxy():
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = '*'
        return response
    
    try:
        endpoint = request.args.get('endpoint')
        if not endpoint:
            return jsonify({'error': 'Endpoint parameter is required'}), 400
        
        decoded_endpoint = urllib.parse.unquote(endpoint)
        
        # CASO 1: Lista completa de ativos
        if decoded_endpoint == 'assets' or decoded_endpoint.startswith('assets?limit='):
            return Response(
                json.dumps({'data': SUPPORTED_CRYPTOS}),
                status=200,
                headers={'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
            )
        
        HEADERS = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,pt;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        # CASO 2: Preço de uma moeda específica
        if decoded_endpoint.startswith('assets/'):
            crypto_id = decoded_endpoint.replace('assets/', '')
            
            if crypto_id not in SYMBOL_MAP:
                return jsonify({'error': f'Crypto {crypto_id} not supported'}), 404
            
            symbol = SYMBOL_MAP[crypto_id]
            full_url = f"{BINANCE_PUBLIC_API}/ticker/price?symbol={symbol}"
            
            response = requests.get(full_url, headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                crypto_info = next((c for c in SUPPORTED_CRYPTOS if c['id'] == crypto_id), None)
                
                result = {
                    'data': {
                        'id': crypto_id,
                        'name': crypto_info['name'] if crypto_info else crypto_id.capitalize(),
                        'symbol': crypto_info['symbol'] if crypto_info else crypto_id.upper(),
                        'priceUsd': data.get('price', '0')
                    }
                }
                
                return Response(
                    json.dumps(result),
                    status=200,
                    headers={'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
                )
            else:
                logging.error(f'Binance API error: {response.status_code} - {response.text}')
                return jsonify({'error': f'Binance API error: {response.status_code}'}), response.status_code
        
        # CASO 3: Múltiplas moedas
        elif decoded_endpoint.startswith('assets?ids='):
            ids_part = decoded_endpoint.replace('assets?ids=', '')
            symbols = ids_part.split(',')
            
            results = []
            for crypto_id in symbols:
                if crypto_id in SYMBOL_MAP:
                    symbol = SYMBOL_MAP[crypto_id]
                    price_url = f"{BINANCE_PUBLIC_API}/ticker/price?symbol={symbol}"
                    try:
                        price_resp = requests.get(price_url, headers=HEADERS, timeout=5)
                        if price_resp.status_code == 200:
                            price_data = price_resp.json()
                            crypto_info = next((c for c in SUPPORTED_CRYPTOS if c['id'] == crypto_id), None)
                            results.append({
                                'id': crypto_id,
                                'name': crypto_info['name'] if crypto_info else crypto_id.capitalize(),
                                'symbol': crypto_info['symbol'] if crypto_info else symbol.replace('USDT', '').replace('BRL', ''),
                                'priceUsd': price_data.get('price', '0')
                            })
                        else:
                            logging.warning(f'Erro ao buscar {crypto_id}: status {price_resp.status_code}')
                    except Exception as e:
                        logging.warning(f'Erro ao buscar {crypto_id}: {str(e)}')
            
            return Response(
                json.dumps({'data': results}),
                status=200,
                headers={'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
            )
        
        else:
            return jsonify({'error': f'Endpoint {decoded_endpoint} not supported'}), 404
            
    except Exception as e:
        logging.error(f'Proxy error: {str(e)}')
        return jsonify({'error': str(e)}), 500


# ============================================================
# ROTA SHAZAM + FALLBACK AUDD
# ============================================================
@app.route('/api/shazam', methods=['POST', 'OPTIONS'])
def shazam_proxy():
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = '*'
        return response

    try:
        if 'file' not in request.files:
            return jsonify({'track': None, 'error': 'Arquivo de áudio não foi enviado'}), 400

        audio_file = request.files['file']

        if not audio_file.filename:
            return jsonify({'track': None, 'error': 'Arquivo de áudio inválido'}), 400

        # Lê o conteúdo do arquivo para reutilizar nas duas APIs
        audio_bytes = audio_file.read()
        audio_filename = audio_file.filename
        audio_mimetype = audio_file.mimetype or 'audio/wav'

        track = None
        shazam_usado = False
        audd_usado = False

        # ============================================================
        # PASSO 1: TENTA COM SHAZAM CORE
        # ============================================================
        rapidapi_key = os.environ.get('RAPIDAPI_KEY')

        if rapidapi_key:
            try:
                shazam_url = 'https://shazam-core.p.rapidapi.com/v1/tracks/recognize'
                shazam_headers = {
                    'x-rapidapi-host': 'shazam-core.p.rapidapi.com',
                    'x-rapidapi-key': rapidapi_key
                }
                shazam_files = {
                    'file': (audio_filename, audio_bytes, audio_mimetype)
                }

                logging.info('[Shazam] Enviando áudio...')
                shazam_response = requests.post(
                    shazam_url,
                    headers=shazam_headers,
                    files=shazam_files,
                    timeout=15
                )

                logging.info(f'[Shazam] Status: {shazam_response.status_code}')

                if shazam_response.status_code == 200:
                    shazam_data = shazam_response.json()
                    if shazam_data and shazam_data.get('track'):
                        track = shazam_data['track']
                        shazam_usado = True
                        logging.info(f'[Shazam] ✅ Encontrado: {track.get("title")}')
                    else:
                        logging.info('[Shazam] ❌ Não identificou. Tentando AudD...')

            except requests.exceptions.Timeout:
                logging.error('[Shazam] Timeout')
            except requests.exceptions.RequestException as e:
                logging.error(f'[Shazam] Erro de rede: {str(e)}')
            except Exception as e:
                logging.error(f'[Shazam] Erro inesperado: {str(e)}')
        else:
            logging.warning('[Shazam] RAPIDAPI_KEY não configurada. Pulando para AudD.')

        # ============================================================
        # PASSO 2: FALLBACK PARA AUDD
        # ============================================================
        if not track:
            audd_token = os.environ.get('AUDD_API_KEY')

            if audd_token:
                try:
                    audd_url = 'https://api.audd.io/'
                    audd_files = {
                        'file': (audio_filename, audio_bytes, audio_mimetype)
                    }
                    audd_data = {
                        'api_token': audd_token,
                        'return': 'apple_music,spotify,deezer'
                    }

                    logging.info('[AudD] Enviando áudio...')
                    audd_response = requests.post(
                        audd_url,
                        data=audd_data,
                        files=audd_files,
                        timeout=15
                    )

                    logging.info(f'[AudD] Status: {audd_response.status_code}')

                    if audd_response.status_code == 200:
                        audd_json = audd_response.json()

                        if audd_json.get('status') == 'success' and audd_json.get('result'):
                            track = normalizar_audd_para_shazam(audd_json['result'])
                            audd_usado = True
                            logging.info(f'[AudD] ✅ Encontrado: {track.get("title")}')
                        else:
                            logging.info('[AudD] ❌ Também não identificou.')

                except requests.exceptions.Timeout:
                    logging.error('[AudD] Timeout')
                except requests.exceptions.RequestException as e:
                    logging.error(f'[AudD] Erro de rede: {str(e)}')
                except Exception as e:
                    logging.error(f'[AudD] Erro inesperado: {str(e)}')
            else:
                logging.warning('[AudD] AUDD_API_KEY não configurada.')

        # ============================================================
        # RETORNA PARA O FRONTEND
        # ============================================================
        fonte = 'shazam' if shazam_usado else ('audd' if audd_usado else 'nenhuma')

        resposta = {
            'track': track,
            'fonte': fonte
        }

        if not track:
            resposta['_debug'] = {
                'shazam': shazam_usado,
                'audd': audd_usado,
                'mensagem': 'Nenhuma das APIs conseguiu identificar a música'
            }

        return Response(
            json.dumps(resposta),
            status=200,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        )


    except Exception as e:
        logging.error(f'Erro no proxy Shazam: {str(e)}')
        return jsonify({'track': None, 'error': str(e)}), 500


# ============================================================
# NORMALIZA RESPOSTA AUDD → FORMATO SHAZAM
# ============================================================
def normalizar_audd_para_shazam(result):
    apple_music = result.get('apple_music', {}) or {}
    spotify = result.get('spotify', {}) or {}
    deezer = result.get('deezer', {}) or {}

    artwork_url = ''
    if apple_music.get('artwork', {}).get('url'):
        artwork_url = apple_music['artwork']['url'].replace('{w}', '400').replace('{h}', '400')
    elif deezer.get('album', {}).get('cover'):
        artwork_url = deezer['album']['cover']

    providers = []

    if spotify.get('external_urls', {}).get('spotify'):
        providers.append({
            'type': 'SPOTIFY',
            'actions': [{'uri': spotify['external_urls']['spotify']}]
        })

    if result.get('song_link'):
        providers.append({
            'type': 'YOUTUBEMUSIC',
            'actions': [{'uri': result['song_link']}]
        })

    if deezer.get('link'):
        providers.append({
            'type': 'DEEZER',
            'actions': [{'uri': deezer['link']}]
        })

    metadata = []
    if result.get('album'):
        metadata.append({'title': 'Album', 'text': result['album']})
    if result.get('release_date'):
        ano = str(result['release_date']).split('-')[0]
        if ano:
            metadata.append({'title': 'Released', 'text': ano})

    return {
        'title': result.get('title') or 'Música desconhecida',
        'subtitle': result.get('artist') or 'Artista desconhecido',
        'images': {
            'coverarthq': artwork_url,
            'coverart': artwork_url
        },
        'hub': {
            'providers': providers
        },
        'sections': [{
            'metadata': metadata
        }] if metadata else []
    }


@app.route('/api/proxy')
def proxy():
    url = request.args.get('url')
    if not url:
        return 'URL parameter is required', 400

    try:
        decoded_url = urllib.parse.unquote(url)
        logging.info(f'Proxying request to: {decoded_url}')

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive',
        }

        def open_stream():
            return requests.get(
                decoded_url,
                headers=headers,
                stream=True,
                timeout=(15, None),  # 15s para conectar; SEM timeout de leitura
                verify=False
            )

        response = open_stream()

        if response.status_code != 200:
            logging.error(f'Radio returned status: {response.status_code}')
            return f'Radio server error: {response.status_code}', response.status_code

        content_type = response.headers.get('content-type', 'audio/mpeg')
        if 'audio' not in content_type and 'application' not in content_type:
            content_type = 'audio/mpeg'

        def generate():
            nonlocal response  # permite reconectar dentro do gerador
            while True:
                try:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            yield chunk
                    logging.warning('Stream ended normally, reconnecting...')
                except (requests.exceptions.ChunkedEncodingError,
                        requests.exceptions.ConnectionError,
                        requests.exceptions.Timeout) as e:
                    logging.warning(f'Stream interrupted ({type(e).__name__}), reconnecting...')
                except Exception as e:
                    logging.error(f'Unexpected streaming error: {str(e)}')
                finally:
                    response.close()

                # Loop de reconexão: até 5 tentativas
                reconnected = False
                for tentativa in range(5):
                    time.sleep(2)
                    try:
                        response = open_stream()
                        if response.status_code == 200:
                            logging.info(f'Reconnected to radio (attempt {tentativa + 1})')
                            reconnected = True
                            break
                        logging.warning(f'Reconnect attempt {tentativa + 1} failed: status {response.status_code}')
                        response.close()
                    except Exception as e:
                        logging.warning(f'Reconnect attempt {tentativa + 1} failed: {str(e)}')

                if not reconnected:
                    logging.error('Could not reconnect to radio after 5 attempts. Ending stream.')
                    return

        return Response(
            generate(),
            status=200,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': content_type,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Connection': 'keep-alive'
            }
        )

    except requests.exceptions.Timeout:
        logging.error('Timeout connecting to radio')
        return 'Timeout connecting to radio', 504
    except requests.exceptions.ConnectionError as e:
        logging.error(f'Connection error: {str(e)}')
        return 'Connection error to radio', 503
    except Exception as e:
        logging.error(f'Proxy error: {str(e)}')
        return f'Error proxying request: {str(e)}', 500

@app.route('/api/nominatim', methods=['GET'])
def nominatim_proxy():
    try:
        query = request.args.get('q')
        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400

        params = {
            'q': query,
            'format': 'json',
            'polygon_geojson': 1,
            'addressdetails': 1
        }
        
        headers = {
            'User-Agent': 'RadioPrimeApp/1.0 (https://radio-prime.vercel.app)'
        }

        response = requests.get(
            'https://nominatim.openstreetmap.org/search',
            params=params,
            headers=headers,
            timeout=15
        )

        if response.status_code == 200:
            return Response(
                json.dumps(response.json()),
                status=200,
                headers={
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=3600'
                }
            )
        else:
            return jsonify({'error': f'Nominatim API error: {response.status_code}'}), response.status_code

    except requests.exceptions.Timeout:
        logging.error('Timeout connecting to Nominatim')
        return jsonify({'error': 'Timeout connecting to Nominatim'}), 504
    except Exception as e:
        logging.error(f'Proxy error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return 'Radio Prime API is running!'


if __name__ == '__main__':
    app.run(threaded=True, debug=False)
