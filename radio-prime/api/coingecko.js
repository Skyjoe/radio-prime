export default async function handler(req, res) {
  try {
    let { endpoint } = req.query;

    // Garante que "?" dentro do endpoint não quebre a query
    if (Array.isArray(endpoint)) endpoint = endpoint.join('/');
    const decodedEndpoint = decodeURIComponent(endpoint);

    const apiUrl = `https://api.coingecko.com/api/v3/${decodedEndpoint}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao buscar dados da CoinGecko:", error);
    res.status(500).json({ error: "Erro ao buscar dados da CoinGecko" });
  }
}



