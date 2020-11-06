const Twitter = require('twitter');
const fs = require('fs');
const fetch = require('node-fetch');
const request = require('request');

const baseURL = "https://pokeapi.co/api/v2/pokemon/";
const pokemonCountURL = "https://pokeapi.co/api/v2/pokemon-species/?limit=0";

const config = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};

const PokemonBot = new Twitter(config);

// Returns the count of the current Pokemon in the API
const getPokemonCount = async (url) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(res => res.json())
      .then(data => resolve(data))
      .catch(error => console.error(error));
  });
};

// Gets the details for a pokemon
const getPokemonDetails = (url) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(res => res.json())
      .then(data => resolve(data))
      .catch(error => console.error(error));
  });
};

// Get a random number within a given range
const randomNumberWithinRange = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

// Download an image given a URL
const downloadImage = (uri, filename, callback) => {
  request.head(uri, (err, res, body) => {
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on('close', callback);
  });
};


const encounterAndTweetPokemon = async () => {
  let caption;
  getPokemonCount(pokemonCountURL).then((response) => {
    return response.count;
  }).then((pokedexCount) => {
    getPokemonDetails(`${baseURL}${randomNumberWithinRange(1, pokedexCount)}`).then((pokemon) => {
      const number = pokemon.id;
      const name = pokemon.name;
      const type = pokemon.types[0].type.name;
      const photoURL = pokemon.sprites.front_default;
      caption = `
      (no. ${number}) - ${name.charAt(0).toUpperCase() + name.slice(1)} - ${type}
      #Pokemon #${name.replace(/-/g, "")}
      `;

      return new Promise((resolve, reject) => {
        downloadImage(photoURL, 'image.png', () => resolve())
      })
    }).then(() => {
      const data = fs.readFileSync(`${__dirname}/image.png`);
      return PokemonBot.post('media/upload', { media: data });
    }).then((media) => {
      console.log('media uploaded successfully');

      const status = {
        status: caption,
        media_ids: media.media_id_string,
      }

      return PokemonBot.post('statuses/update', status);
    }).then((tweet) => {
      console.log('Tweeted: ', tweet);
    }).catch((error) => {
      console.log(error);
    })
  });
}

encounterAndTweetPokemon();
