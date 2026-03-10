/**
 * Era-specific news bulletins with persona definitions.
 * In production, integrate with NYT Archive API.
 *
 * NYT_API_KEY=your_key_here
 */

const newsPersonas = {
  '1950s': {
    style: 'formal',
    voiceName: 'Mid-Atlantic Announcer',
    rate: 0.88,
    pitch: 0.82,
    intro: 'Good evening, ladies and gentlemen. This is your news broadcast.',
  },
  '1960s': {
    style: 'authoritative',
    voiceName: 'Network Anchor',
    rate: 0.92,
    pitch: 0.88,
    intro: 'And now, the evening news.',
  },
  '1970s': {
    style: 'smooth',
    voiceName: 'FM DJ',
    rate: 0.85,
    pitch: 0.75,
    intro: "Hey there, beautiful people. Time to lay some news on you.",
  },
  '1980s': {
    style: 'energetic',
    voiceName: 'Top 40 Host',
    rate: 1.15,
    pitch: 1.08,
    intro: "This just in! Breaking news coming at you live!",
  },
  '1990s': {
    style: 'cynical',
    voiceName: 'Gen X Reporter',
    rate: 1.0,
    pitch: 0.95,
    intro: "Yeah, so... here's what's happening in the world, I guess.",
  },
  '2000s': {
    style: 'polished',
    voiceName: 'Cable News Anchor',
    rate: 1.05,
    pitch: 1.0,
    intro: "Breaking news this hour.",
  },
  '2010s': {
    style: 'digital',
    voiceName: 'Digital Correspondent',
    rate: 1.1,
    pitch: 1.0,
    intro: "Trending now — here's your news update.",
  },
  '2020s': {
    style: 'podcast',
    voiceName: 'Podcast Host',
    rate: 1.05,
    pitch: 1.0,
    intro: "Welcome back. Let's dive into today's headlines.",
  },
};

const newsHeadlines = {
  1950: [
    "President Truman orders the development of the hydrogen bomb, escalating the arms race with the Soviet Union.",
    "The Korean War begins as North Korean forces cross the 38th parallel.",
    "Senator Joseph McCarthy claims to have a list of Communists in the State Department.",
  ],
  1952: [
    "Dwight D. Eisenhower wins the presidential election in a landslide victory.",
    "The United States tests the first hydrogen bomb at Enewetak Atoll.",
    "Queen Elizabeth the Second ascends to the British throne.",
  ],
  1955: [
    "Rosa Parks refuses to give up her bus seat in Montgomery, Alabama, sparking the civil rights movement.",
    "Disneyland opens its gates in Anaheim, California.",
    "Albert Einstein passes away at the age of seventy-six.",
  ],
  1957: [
    "The Soviet Union launches Sputnik, the first artificial satellite, into orbit around the Earth.",
    "President Eisenhower sends federal troops to Little Rock to enforce school desegregation.",
    "The Space Age has officially begun as the world looks to the stars.",
  ],
  1960: [
    "John F. Kennedy and Richard Nixon face off in the first televised presidential debate.",
    "The U-2 spy plane incident heightens Cold War tensions between Washington and Moscow.",
    "African nations declare independence in what is being called the Year of Africa.",
  ],
  1963: [
    "President John F. Kennedy is assassinated in Dallas, Texas. The nation mourns.",
    "Martin Luther King Junior delivers his I Have a Dream speech at the March on Washington.",
    "The hotline between Washington and Moscow is established to prevent nuclear war.",
  ],
  1965: [
    "American combat troops arrive in Vietnam as the war escalates.",
    "The Voting Rights Act is signed into law by President Johnson.",
    "A massive blackout plunges the entire northeastern United States into darkness.",
  ],
  1969: [
    "Neil Armstrong takes one small step for man, one giant leap for mankind on the surface of the Moon.",
    "Half a million people gather at Woodstock for three days of peace and music.",
    "The first message is sent over ARPANET, the precursor to the internet.",
  ],
  1970: [
    "Four students are killed at Kent State University during anti-war protests.",
    "The first Earth Day is celebrated across the United States.",
    "The Beatles officially announce their breakup, ending an era in music.",
  ],
  1973: [
    "The Watergate scandal deepens as President Nixon faces mounting pressure to resign.",
    "The oil embargo sends gas prices soaring and lines at the pump stretch for blocks.",
    "The Vietnam War ceasefire is signed in Paris.",
  ],
  1975: [
    "Saigon falls to North Vietnamese forces, ending the Vietnam War.",
    "Microsoft is founded by Bill Gates and Paul Allen in Albuquerque.",
    "Gas prices continue to squeeze American wallets at the pump.",
  ],
  1977: [
    "Star Wars opens in theaters and changes cinema forever.",
    "Elvis Presley, the King of Rock and Roll, passes away at Graceland.",
    "The New York City blackout of 1977 plunges the city into chaos.",
  ],
  1980: [
    "John Lennon is shot and killed outside his New York apartment. The world mourns.",
    "Mount St. Helens erupts in Washington State in a catastrophic explosion.",
    "The United States boycotts the Moscow Olympics over the Soviet invasion of Afghanistan.",
  ],
  1981: [
    "MTV launches with the words 'Ladies and gentlemen, rock and roll.'",
    "President Reagan is shot outside the Washington Hilton but survives.",
    "The first Space Shuttle Columbia launches from Cape Canaveral.",
  ],
  1985: [
    "Live Aid concerts in London and Philadelphia raise millions for Ethiopian famine relief.",
    "The Nintendo Entertainment System launches in America, reviving the video game industry.",
    "Back to the Future hits theaters — and speaking of the future, where we're going, we don't need roads!",
  ],
  1989: [
    "The Berlin Wall falls as East and West Germany begin reunification.",
    "The Tiananmen Square protests in Beijing are met with a brutal crackdown.",
    "The World Wide Web is invented by Tim Berners-Lee at CERN.",
  ],
  1990: [
    "Nelson Mandela is freed after twenty-seven years in prison.",
    "Germany officially reunifies as the Cold War era comes to a close.",
    "The Hubble Space Telescope launches into orbit, though it has a slight mirror problem.",
  ],
  1991: [
    "The Soviet Union officially dissolves. The Cold War is over.",
    "Operation Desert Storm begins as coalition forces liberate Kuwait.",
    "The World Wide Web becomes available to the public for the first time.",
  ],
  1995: [
    "The Oklahoma City bombing kills one hundred sixty-eight people in a domestic terror attack.",
    "Windows 95 launches with massive fanfare — people are literally lining up at midnight for software.",
    "The O.J. Simpson trial verdict divides the nation.",
  ],
  1999: [
    "The Y2K bug has the world on edge. Will computers crash at midnight?",
    "The euro currency is introduced in eleven European countries.",
    "The dot-com bubble continues to inflate as internet stocks reach dizzying heights.",
  ],
  2000: [
    "The Y2K transition passes without major incident. The lights stayed on, folks.",
    "The presidential election between Bush and Gore comes down to hanging chads in Florida.",
    "The dot-com bubble shows signs of bursting as tech stocks plummet.",
  ],
  2001: [
    "The September 11th attacks change America and the world forever.",
    "The War in Afghanistan begins in response to the terrorist attacks.",
    "Apple introduces the iPod, putting a thousand songs in your pocket.",
  ],
  2005: [
    "Hurricane Katrina devastates the Gulf Coast, leaving New Orleans underwater.",
    "YouTube launches, and the era of online video begins.",
    "Facebook expands beyond colleges and begins its path to global domination.",
  ],
  2007: [
    "Apple unveils the iPhone, and the smartphone revolution begins.",
    "The housing bubble begins to burst, signaling the coming financial crisis.",
    "The final Harry Potter book is published, ending the beloved series.",
  ],
  2008: [
    "Barack Obama is elected as the forty-fourth president of the United States.",
    "The global financial crisis sends markets into free fall.",
    "Bitcoin's whitepaper is published by the mysterious Satoshi Nakamoto.",
  ],
  2010: [
    "The Deepwater Horizon oil spill becomes the largest marine oil spill in history.",
    "The iPad launches, creating an entirely new category of computing.",
    "Instagram launches and changes how we share photos forever.",
  ],
  2012: [
    "The Curiosity rover lands on Mars, sending back stunning images.",
    "Hurricane Sandy devastates the eastern seaboard.",
    "Gangnam Style becomes the first YouTube video to reach one billion views.",
  ],
  2015: [
    "The Supreme Court legalizes same-sex marriage nationwide.",
    "The Paris Climate Agreement is adopted by one hundred ninety-five nations.",
    "SpaceX successfully lands a reusable rocket for the first time.",
  ],
  2016: [
    "Donald Trump is elected the forty-fifth president in a shocking upset.",
    "The United Kingdom votes to leave the European Union in the Brexit referendum.",
    "Pokémon Go takes the world by storm, getting people outside for once.",
  ],
  2020: [
    "A global pandemic shuts down the world as COVID-19 spreads across every continent.",
    "The world goes into lockdown. Working from home becomes the new normal.",
    "The James Webb Space Telescope promises to peer deeper into the cosmos than ever before.",
  ],
  2022: [
    "ChatGPT launches and artificial intelligence enters the mainstream conversation.",
    "Russia invades Ukraine, triggering the largest conflict in Europe since World War Two.",
    "Inflation hits forty-year highs, squeezing household budgets worldwide.",
  ],
  2024: [
    "Artificial intelligence continues to transform industries at a breathtaking pace.",
    "The global push for renewable energy reaches new milestones.",
    "Space tourism takes another step forward as private companies expand their reach.",
  ],
};

export function getEraKey(year) {
  if (year < 1960) return '1950s';
  if (year < 1970) return '1960s';
  if (year < 1980) return '1970s';
  if (year < 1990) return '1980s';
  if (year < 2000) return '1990s';
  if (year < 2010) return '2000s';
  if (year < 2020) return '2010s';
  return '2020s';
}

export function getPersona(year) {
  return newsPersonas[getEraKey(year)];
}

export function getNewsBulletin(year) {
  const years = Object.keys(newsHeadlines).map(Number).sort((a, b) => a - b);
  let closest = years[0];
  for (const y of years) {
    if (Math.abs(y - year) < Math.abs(closest - year)) {
      closest = y;
    }
  }

  const headlines = newsHeadlines[closest] || newsHeadlines[2020];
  const persona = getPersona(year);
  const headline = headlines[Math.floor(Math.random() * headlines.length)];

  return {
    script: `${persona.intro} ${headline}`,
    persona,
    headline,
    year: closest,
  };
}

export function getNewsBulletinScript(year) {
  const bulletin = getNewsBulletin(year);
  return bulletin.script;
}

export { newsPersonas, newsHeadlines };
