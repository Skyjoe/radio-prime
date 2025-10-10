export default async function handler(req, res) {
  const { endpoint } = req.query;
  const apiUrl = `https://api.coingecko.com/api/v3/${endpoint}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao buscar dados da CoinGecko:", error);
    res.status(500).json({ error: "Erro ao buscar dados da CoinGecko" });
  }
}

