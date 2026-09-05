from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests
import logging
import json
import urllib.parse
import os

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


@app.route('/api/shazam', methods=['POST', 'OPTIONS'])
def shazam_proxy():
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = '*'
        return response

    try:
        # Verifica se o arquivo de áudio foi enviado
        if 'file' not in request.files:
            return jsonify({
                'error': 'Arquivo de áudio não foi enviado'
            }), 400

        audio_file = request.files['file']

        if not audio_file.filename:
            return jsonify({
                'error': 'Arquivo de áudio inválido'
            }), 400

        # Obtém a chave armazenada na Vercel
        rapidapi_key = os.environ.get('RAPIDAPI_KEY')

        if not rapidapi_key:
            logging.error('RAPIDAPI_KEY não configurada')
            return jsonify({
                'error': 'RAPIDAPI_KEY não configurada no servidor'
            }), 500

        # Envia o WAV para o Shazam Core
        rapidapi_url = 'https://shazam-core.p.rapidapi.com/v1/tracks/recognize'

        headers = {
            'x-rapidapi-host': 'shazam-core.p.rapidapi.com',
            'x-rapidapi-key': rapidapi_key
        }

        files = {
            'file': (
                audio_file.filename,
                audio_file.stream,
                audio_file.mimetype or 'audio/wav'
            )
        }

        logging.info('Enviando áudio para Shazam Core...')

        response = requests.post(
            rapidapi_url,
            headers=headers,
            files=files,
            timeout=30
        )

        logging.info(
            f'Shazam Core respondeu: {response.status_code}'
        )

        return Response(
            response.content,
            status=response.status_code,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        )

    except requests.exceptions.Timeout:
        logging.error('Timeout ao conectar ao Shazam Core')
        return jsonify({
            'error': 'Timeout ao conectar ao Shazam'
        }), 504

    except requests.exceptions.RequestException as e:
        logging.error(f'Erro na requisição ao Shazam: {str(e)}')
        return jsonify({
            'error': 'Erro ao conectar ao Shazam'
        }), 502

    except Exception as e:
        logging.error(f'Erro no proxy Shazam: {str(e)}')
        return jsonify({
            'error': str(e)
        }), 500


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
            'Accept-Encoding': 'identity',  # Força áudio não compactado para não ter falhas
            'Connection': 'keep-alive',

        }
        
        response = requests.get(
            decoded_url, 
            headers=headers, 
            stream=True, 
            timeout=30,
            verify=False
        )
        
        if response.status_code != 200:
            logging.error(f'Radio returned status: {response.status_code}')
            return f'Radio server error: {response.status_code}', response.status_code
        
        content_type = response.headers.get('content-type', 'audio/mpeg')
        if 'audio' not in content_type and 'application' not in content_type:
            content_type = 'audio/mpeg'
        
        # O segredo para acabar com os soluços está no chunk_size=4096 (fluxo contínuo e suave)
        def generate():
            try:
                for chunk in response.iter_content(chunk_size=4096):
                    if chunk:
                        yield chunk
            except Exception as e:
                logging.error(f'Error streaming: {str(e)}')
                yield b''
        
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
        
    except requests.exceptions.SSLError as e:
        logging.error(f'SSL Error: {str(e)}')
        try:
            response = requests.get(decoded_url, headers=headers, stream=True, timeout=30, verify=False)
            if response.status_code == 200:
                def generate():
                    for chunk in response.iter_content(chunk_size=4096):
                        if chunk:
                            yield chunk
                return Response(
                    generate(),
                    status=200,
                    headers={
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'audio/mpeg',
                        'Cache-Control': 'no-cache'
                    }
                )
        except:
            pass
        return 'SSL Error connecting to radio', 500
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
    """Proxy para a API Nominatim do OpenStreetMap"""
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
    print('=' * 60)
    print('Radio Prime API Server')
    print('=' * 60)
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
