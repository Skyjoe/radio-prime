from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests
import logging
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

# Binance Public API (NÃO precisa de chave)
# Documentação: https://developers.binance.com/docs/binance-spot-api-docs/rest-api
BINANCE_PUBLIC_API = 'https://api.binance.com/api/v3'

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
        
        import urllib.parse
        decoded_endpoint = urllib.parse.unquote(endpoint)
        
        # --- Mapeamento para a API Pública da Binance ---
        
        # 1. Caso: Preço de uma moeda específica (ex: assets/bitcoin)
        if decoded_endpoint.startswith('assets/'):
            crypto_id = decoded_endpoint.replace('assets/', '')
            symbol_map = {
                'bitcoin': 'BTCUSDT',
                'ethereum': 'ETHUSDT',
                'cardano': 'ADAUSDT',
                'binancecoin': 'BNBUSDT',
                'solana': 'SOLUSDT',
                'ripple': 'XRPUSDT',
                'dogecoin': 'DOGEUSDT',
                'polkadot': 'DOTUSDT',
                'chainlink': 'LINKUSDT',
                'tether': 'USDTBRL'  # USDT em BRL
            }
            
            if crypto_id not in symbol_map:
                return jsonify({'error': f'Crypto {crypto_id} not supported'}), 404
            
            symbol = symbol_map[crypto_id]
            # Endpoint público: /api/v3/ticker/price
            full_url = f"{BINANCE_PUBLIC_API}/ticker/price?symbol={symbol}"
            
        # 2. Caso: Múltiplas moedas (ex: assets?ids=bitcoin,ethereum)
        elif decoded_endpoint.startswith('assets?ids='):
            ids_part = decoded_endpoint.replace('assets?ids=', '')
            symbols = ids_part.split(',')
            
            symbol_map = {
                'bitcoin': 'BTCUSDT',
                'ethereum': 'ETHUSDT',
                'cardano': 'ADAUSDT',
                'binancecoin': 'BNBUSDT',
                'solana': 'SOLUSDT',
                'ripple': 'XRPUSDT',
                'dogecoin': 'DOGEUSDT',
                'polkadot': 'DOTUSDT',
                'chainlink': 'LINKUSDT',
                'tether': 'USDTBRL'
            }
            
            results = []
            for crypto_id in symbols:
                if crypto_id in symbol_map:
                    symbol = symbol_map[crypto_id]
                    # Endpoint público para cada símbolo
                    price_url = f"{BINANCE_PUBLIC_API}/ticker/price?symbol={symbol}"
                    try:
                        price_resp = requests.get(price_url, timeout=5)
                        if price_resp.status_code == 200:
                            price_data = price_resp.json()
                            # Converte para o formato esperado
                            results.append({
                                'id': crypto_id,
                                'name': crypto_id.capitalize(),
                                'symbol': symbol.replace('USDT', '').replace('BRL', ''),
                                'priceUsd': price_data.get('price', '0')
                            })
                    except Exception as e:
                        logging.warning(f'Erro ao buscar {crypto_id}: {str(e)}')
            
            return Response(
                json.dumps({'data': results}),
                status=200,
                headers={
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            )
        
        else:
            return jsonify({'error': f'Endpoint {decoded_endpoint} not supported'}), 404
        
        # --- Faz a requisição para a Binance ---
        logging.info(f'Binance Public API request: {full_url}')
        response = requests.get(full_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Converte para o formato da aplicação
            if 'price' in data and 'symbol' in data:
                # Extrai o nome do símbolo (ex: BTCUSDT -> BTC)
                symbol_name = data['symbol'].replace('USDT', '').replace('BRL', '')
                crypto_name = {
                    'BTC': 'Bitcoin',
                    'ETH': 'Ethereum',
                    'ADA': 'Cardano',
                    'BNB': 'BNB',
                    'SOL': 'Solana',
                    'XRP': 'XRP',
                    'DOGE': 'Dogecoin',
                    'DOT': 'Polkadot',
                    'LINK': 'Chainlink',
                    'USDT': 'Tether'
                }.get(symbol_name, symbol_name)
                
                result = {
                    'data': {
                        'id': crypto_id if 'crypto_id' in locals() else 'bitcoin',
                        'name': crypto_name,
                        'symbol': symbol_name,
                        'priceUsd': data['price']
                    }
                }
            else:
                result = data
            
            return Response(
                json.dumps(result),
                status=200,
                headers={
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            )
        else:
            error_msg = f'Binance API error: {response.status_code}'
            logging.error(error_msg)
            return jsonify({'error': error_msg}), response.status_code
            
    except requests.exceptions.Timeout:
        logging.error('Timeout connecting to Binance')
        return jsonify({'error': 'Timeout connecting to Binance'}), 504
    except requests.exceptions.ConnectionError as e:
        logging.error(f'Connection error: {str(e)}')
        return jsonify({'error': 'Connection error to Binance'}), 503
    except Exception as e:
        logging.error(f'Proxy error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/crypto/assets', methods=['GET'])
def crypto_assets():
    """Lista de ativos suportados"""
    assets = [
        {'id': 'bitcoin', 'name': 'Bitcoin', 'symbol': 'BTC'},
        {'id': 'ethereum', 'name': 'Ethereum', 'symbol': 'ETH'},
        {'id': 'cardano', 'name': 'Cardano', 'symbol': 'ADA'},
        {'id': 'binancecoin', 'name': 'BNB', 'symbol': 'BNB'},
        {'id': 'solana', 'name': 'Solana', 'symbol': 'SOL'},
        {'id': 'ripple', 'name': 'XRP', 'symbol': 'XRP'},
        {'id': 'dogecoin', 'name': 'Dogecoin', 'symbol': 'DOGE'},
        {'id': 'polkadot', 'name': 'Polkadot', 'symbol': 'DOT'},
        {'id': 'chainlink', 'name': 'Chainlink', 'symbol': 'LINK'},
        {'id': 'tether', 'name': 'Tether', 'symbol': 'USDT'}
    ]
    return Response(
        json.dumps({'data': assets}),
        status=200,
        headers={
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        }
    )

@app.route('/api/proxy')
def proxy():
    url = request.args.get('url')
    if not url:
        return 'URL parameter is required', 400
    
    try:
        import urllib.parse
        decoded_url = urllib.parse.unquote(url)
        logging.info(f'Proxying radio request to: {decoded_url}')
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(decoded_url, headers=headers, stream=True, timeout=30)
        
        if response.status_code != 200:
            return f'Radio server error: {response.status_code}', response.status_code
        
        def generate():
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    yield chunk
        
        return Response(
            generate(),
            status=200,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Content-Type': response.headers.get('content-type', 'audio/mpeg'),
                'Cache-Control': 'no-cache'
            }
        )
    except Exception as e:
        logging.error(f'Proxy error: {str(e)}')
        return 'Error proxying request', 500

@app.route('/test-crypto')
def test_crypto():
    """Endpoint de teste para verificar a API pública da Binance"""
    try:
        # Testa o endpoint público de preço do Bitcoin
        response = requests.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', timeout=10)
        if response.status_code == 200:
            data = response.json()
            return jsonify({
                'status': 'OK',
                'api': 'Binance Public API',
                'endpoint': '/api/v3/ticker/price',
                'bitcoin_price_usd': data.get('price', 'N/A'),
                'test': 'success',
                'note': 'Esta é a API pública, NÃO requer autenticação'
            })
        else:
            return jsonify({
                'status': 'ERROR',
                'message': f'Binance returned status {response.status_code}'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'message': str(e)
        }), 500

@app.route('/')
def index():
    return 'Proxy Server is running with Binance Public API!'

if __name__ == '__main__':
    print('=' * 70)
    print('Proxy Server iniciado com Binance Public API!')
    print('Acesse: http://localhost:5000')
    print('Teste a API: http://localhost:5000/test-crypto')
    print('')
    print('✅ Endpoints públicos (NÃO requerem chave):')
    print('   - Preço do Bitcoin: /api/crypto?endpoint=assets/bitcoin')
    print('   - Múltiplos preços: /api/crypto?endpoint=assets?ids=bitcoin,ethereum')
    print('   - Lista de ativos: /api/crypto/assets')
    print('')
    print('📖 Documentação: https://developers.binance.com/docs/binance-spot-api-docs/rest-api')
    print('=' * 70)
    app.run(debug=True, host='0.0.0.0', port=5000)
