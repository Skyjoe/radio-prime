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



# Configuração das Chaves de API via Variáveis de Ambiente
NEWSDATA_API_KEY = os.environ.get("NEWSDATA_KEY")
RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY")


# Trecho reescrito e corrigido para a rota /api/noticias
# Coloque este bloco no lugar do trecho atual dentro de api/index.py
# Certifique-se de que os imports no topo do arquivo incluem: re, requests, uuid, time, traceback

# Função de fallback local (garante resumo mesmo se a IA falhar)
def simple_local_summary(title, description, max_words=50):
    base = f"{title}. {description or ''}".strip()
    words = base.split()
    if len(words) <= max_words:
        out = " ".join(words)
    else:
        out = " ".join(words[:max_words])
    if not re.search(r"[.!?]$", out):
        out += "."
    return "[RESUMO]: " + out

@app.route('/api/noticias', methods=['GET'])
def obter_noticias():
    url_news = "https://newsdata.io/api/1/latest"

    filtros = {
        "apikey": NEWSDATA_API_KEY,
        "country": "br",
        "language": "pt",
        "category": "politics,business,technology,world,science"
    }

    try:
        # 1. Busca única das notícias na NewsData.io
        response = requests.get(url_news, params=filtros, timeout=10)

        if response.status_code != 200:
            print(f"Erro NewsData API {response.status_code}: {response.text}")
            return jsonify({"status": "error", "message": f"Erro NewsData: {response.text}"}), response.status_code

        response.encoding = 'utf-8'
        data = response.json()

        # Se houver resultados, fazemos a filtragem e a chamada da IA de forma segura
        if "results" in data and len(data["results"]) > 0:
            lote_filtrado = []

            for n in data["results"]:
                titulo_lower = n.get("title", "").lower() if n.get("title") else ""
                desc_lower = n.get("description", "").lower() if n.get("description") else ""

                # Pula propagandas, cupons e matérias trancadas
                if any(termo in titulo_lower or termo in desc_lower for termo in [
                    "cupom", "shopee", "oferta", "exclusiva para assinantes", "assinante"
                ]):
                    continue

                # Trata descrições vazias ou com redirecionamento
                if not n.get("description") or "acesse o portal" in desc_lower or "acesse o link" in desc_lower:
                    n["description"] = "Acompanhe os desdobramentos e informações desta manchete jornalística de última hora."
                else:
                    descricao_limpa = n["description"].replace("[...]", "").strip()
                    palavras = descricao_limpa.split()
                    # Remove conectivos cortados no fim da frase
                    if palavras and palavras[-1].lower() in ["as", "os", "a", "o", "com", "de", "e", "em", "para", "por"]:
                        descricao_limpa = " ".join(palavras[:-1]) + "..."
                    n["description"] = descricao_limpa

                # Limpeza estética do padrão de blogs
                if "the post" in desc_lower and "appeared first on" in desc_lower:
                    n["description"] = n["description"].split("The post")[0].strip()

                lote_filtrado.append(n)
                if len(lote_filtrado) == 10:
                    break

            # 2. Prompt header (defina instruções claras e rígidas)
            prompt_header = (
                "Você é um jornalista profissional. Para cada item abaixo, gere um único parágrafo jornalístico em português, "
                "máximo 50 palavras, sem propaganda, sem chamadas para ler a matéria completa, sem menções a assinaturas ou links. "
                "Integre o título na PRIMEIRA FRASE de forma natural e explícita, usando também a descrição para contextualizar. "
                "Trate cada item isoladamente; não misture itens. Remova '[...]', 'acesse o portal', 'acesse o link', 'leia mais', "
                "'assinante', 'cupom', 'oferta', 'shopee' e similares. Comece cada parágrafo com '[RESUMO]: ' e finalize sempre com ponto final. "
                "Entregue sentenças completas; não deixe frases iniciadas sem conclusão.\n\n"
            )

            # Monta texto_agrupado com prompt + itens (uma única vez)
            texto_agrupado = prompt_header
            for index, noticia in enumerate(lote_filtrado):
                titulo = noticia.get("title", "").strip()
                descricao = noticia.get("description", "").strip()
                texto_agrupado += (
                    f"--- ITEM {index + 1} ---\n"
                    f"Título da Notícia: {titulo}\n"
                    f"Contexto Adicional: {descricao}\n\n"
                )

            # Defina URL, headers e payload ANTES do try para evitar UnboundLocalError
            # OBS: ajuste url_summary e headers_summary para o endpoint/modelo real que você usa na RapidAPI
            url_summary = "https://gpt-summarization.p.rapidapi.com/summarize"  # placeholder — substitua pelo endpoint real
            headers_summary = {
                "Content-Type": "application/json",
                "x-rapidapi-host": "rapidapi.com",
                "x-rapidapi-key": RAPIDAPI_KEY
            }
            payload_summary = {
                "prompt": texto_agrupado,
                "temperature": 0.0,
                "max_tokens": 220,
                "top_p": 1.0
            }

            request_id = str(uuid.uuid4())
            print(f"[{request_id}] Iniciando chamada de resumo - itens: {len(lote_filtrado)}")

            try:
                print(f"[{request_id}] Chamando API de resumos (POST) para gerar resumos...")
                start = time.time()
                res_summary = requests.post(url_summary, json=payload_summary, headers=headers_summary, timeout=12)
                elapsed = time.time() - start
                print(f"[{request_id}] POST concluído em {elapsed:.2f}s - status: {res_summary.status_code}")

                # Log do corpo (preview)
                body_preview = res_summary.text[:2000] if hasattr(res_summary, "text") else str(res_summary)
                print(f"[{request_id}] Response body (preview): {body_preview}")

                if res_summary.status_code == 200:
                    data_summary = res_summary.json()
                    # Ajuste conforme o campo retornado pela sua API (summary, text, choices[0].text, etc.)
                    texto_formatado = data_summary.get("summary") or data_summary.get("text") or ""
                    lista_resumos = [t.strip() for t in re.split(r"\[RESUMO\]\s*", texto_formatado) if t.strip()]

                    # Funções auxiliares (limpeza e truncamento)
                    def clean_promotional(text):
                        patterns = [r"\[.*?\]", r"acesse o portal", r"acesse o link", r"leia mais",
                            r"assinante", r"exclusiva para assinantes", r"cupom", r"oferta", r"shopee"
                        ]
                        txt = text
                        for p in patterns:
                            txt = re.sub(p, "", txt, flags=re.IGNORECASE)
                        return " ".join(txt.split()).strip()

                    def ensure_sentence_end(text):
                        text = text.strip()
                        text = re.sub(r"\.{2,}$", ".", text)
                        if not re.search(r"[.!?]$", text):
                            text = text + "."
                        return text

                    def limit_to_50_words_keep_sentences(text):
                        words = text.split()
                        if len(words) <= 50:
                            return text
                        sentences = re.split(r'(?<=[.!?])\s+', text)
                        out = ""
                        for s in sentences:
                            candidate = (out + " " + s).strip() if out else s
                            if len(candidate.split()) <= 50:
                                out = candidate
                            else:
                                break
                        if out:
                            return out if re.search(r"[.!?]$", out) else out + "."
                        truncated = " ".join(words[:50])
                        return truncated + "."

                    # Aplicar limpeza e validação
                    if len(lista_resumos) == len(lote_filtrado):
                        for idx, resumo in enumerate(lista_resumos):
                            r = clean_promotional(resumo)
                            r = ensure_sentence_end(r)
                            r = limit_to_50_words_keep_sentences(r)
                            titulo_original = lote_filtrado[idx].get("title", "").strip()
                            # Se o título não aparece no resumo, prefixar de forma simples (garantir integração)
                            if titulo_original and titulo_original.lower() not in r.lower():
                                prefix = f"{titulo_original}:"
                                candidate = f"{prefix} {r}"
                                candidate = limit_to_50_words_keep_sentences(candidate)
                                r = candidate
                            if not r.startswith("[RESUMO]:"):
                                r = "[RESUMO]: " + r
                            lote_filtrado[idx]["description"] = r
                    else:
                        print(f"[{request_id}] Aviso: número de resumos retornados ({len(lista_resumos)}) diferente do esperado ({len(lote_filtrado)}).")
                        # fallback local para cada item
                        for idx, noticia in enumerate(lote_filtrado):
                            titulo_original = noticia.get("title", "").strip()
                            descricao_original = noticia.get("description", "").strip()
                            lote_filtrado[idx]["description"] = simple_local_summary(titulo_original, descricao_original, max_words=50)
                else:
                    print(f"[{request_id}] Erro na API de resumo: {res_summary.status_code} - {res_summary.text}")
                    # fallback local para cada item
                    for idx, noticia in enumerate(lote_filtrado):
                        titulo_original = noticia.get("title", "").strip()
                        descricao_original = noticia.get("description", "").strip()
                        lote_filtrado[idx]["description"] = simple_local_summary(titulo_original, descricao_original, max_words=50)

            except Exception as summary_error:
                print(f"[{request_id}] Exceção ao chamar API de resumos: {summary_error}")
                traceback.print_exc()
                # fallback local para cada item
                for idx, noticia in enumerate(lote_filtrado):
                    titulo_original = noticia.get("title", "").strip()
                    descricao_original = noticia.get("description", "").strip()
                    lote_filtrado[idx]["description"] = simple_local_summary(titulo_original, descricao_original, max_words=50)

            # Continua o fluxo normal
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
