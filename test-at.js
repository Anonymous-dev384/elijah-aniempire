const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('https://api.animethemes.moe/artist?filter[slug]=sweet_arms&include=songs.animethemes', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log(JSON.stringify(res.data.artists[0].songs[0], null, 2));
  } catch (e) {
    console.error(e.message);
  }
})();
