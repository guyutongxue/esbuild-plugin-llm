import { bottlesOfBeer } from 'virtual:llm' with {
  prompt: 'export an `bottlesOfBeer` function that takes an integer `n` \
(defaulting to 99) and returns the full song lyrics for `n` bottles \
of beer as a single string. The lyrics should be accurate to the song.'
};

const lyrics = bottlesOfBeer(3);
console.log(lyrics);
