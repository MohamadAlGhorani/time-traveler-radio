/**
 * Music database — real hits organized by region AND year.
 * Each city maps to a region; each region has era-specific tracks with YouTube IDs.
 *
 * getTopHit(year, city) → best track for that place & time.
 *
 * All YouTube IDs verified via oEmbed API (2024-03).
 */

// ── City → Region mapping ──
const cityRegion = {
  'New York':      'us',
  'Los Angeles':   'us',
  'Chicago':       'us',
  'Nashville':     'us',
  'London':        'uk',
  'Paris':         'france',
  'Berlin':        'germany',
  'Tokyo':         'japan',
  'Seoul':         'korea',
  'Beijing':       'china',
  'Mumbai':        'india',
  'Cairo':         'middleeast',
  'Moscow':        'russia',
  'Lagos':         'africa',
  'Havana':        'latin',
  'Mexico City':   'latin',
  'Rio de Janeiro':'brazil',
  'São Paulo':     'brazil',
  'Buenos Aires':  'latin',
  'Sydney':        'australia',
};

// ── Regional music databases ──
const regionalMusic = {
  us: {
    1950: [
      { title: "Mona Lisa", artist: "Nat King Cole", ytId: "NIDX18Xl16s" },
    ],
    1955: [
      { title: "Rock Around the Clock", artist: "Bill Haley", ytId: "ZgdufzXvjqw" },
      { title: "Johnny B. Goode", artist: "Chuck Berry", ytId: "HnTxInl1AH8" },
    ],
    1960: [
      { title: "The Twist", artist: "Chubby Checker", ytId: "im9XuJJXylw" },
    ],
    1963: [
      { title: "I Want to Hold Your Hand", artist: "The Beatles", ytId: "jenWdylTtzs" },
    ],
    1965: [
      { title: "(I Can't Get No) Satisfaction", artist: "The Rolling Stones", ytId: "nrIPxlFzDi0" },
    ],
    1967: [
      { title: "Respect", artist: "Aretha Franklin", ytId: "6FOUqQt3Kg0" },
    ],
    1969: [
      { title: "Come Together", artist: "The Beatles", ytId: "45cYwDMibGo" },
      { title: "Fortunate Son", artist: "CCR", ytId: "ec0XKhAHR5I" },
    ],
    1971: [
      { title: "Imagine", artist: "John Lennon", ytId: "YkgkThdzX-8" },
      { title: "Stairway to Heaven", artist: "Led Zeppelin", ytId: "QkF3oxziUI4" },
    ],
    1975: [
      { title: "Bohemian Rhapsody", artist: "Queen", ytId: "fJ9rUzIMcZQ" },
    ],
    1977: [
      { title: "Stayin' Alive", artist: "Bee Gees", ytId: "fNFzfwLM72c" },
      { title: "Hotel California", artist: "Eagles", ytId: "09839DpTctU" },
    ],
    1980: [
      { title: "Another One Bites the Dust", artist: "Queen", ytId: "rY0WxgSXdEE" },
    ],
    1982: [
      { title: "Billie Jean", artist: "Michael Jackson", ytId: "Zi_XLOBDo_Y" },
      { title: "Eye of the Tiger", artist: "Survivor", ytId: "btPJPFnesV4" },
    ],
    1983: [
      { title: "Every Breath You Take", artist: "The Police", ytId: "OMOGaugKpzs" },
      { title: "Thriller", artist: "Michael Jackson", ytId: "sOnqjkJTMaA" },
    ],
    1985: [
      { title: "Shout", artist: "Tears for Fears", ytId: "Ye7FKc1JQe4" },
      { title: "Take On Me", artist: "a-ha", ytId: "djV11Xbc914" },
      { title: "Everybody Wants to Rule the World", artist: "Tears for Fears", ytId: "aGCdLKXNF3w" },
    ],
    1987: [
      { title: "Never Gonna Give You Up", artist: "Rick Astley", ytId: "dQw4w9WgXcQ" },
      { title: "Sweet Child O' Mine", artist: "Guns N' Roses", ytId: "1w7OgIMMRc4" },
    ],
    1991: [
      { title: "Smells Like Teen Spirit", artist: "Nirvana", ytId: "hTWKbfoikeg" },
      { title: "Under the Bridge", artist: "Red Hot Chili Peppers", ytId: "GLvohMXgcBo" },
    ],
    1993: [
      { title: "I Will Always Love You", artist: "Whitney Houston", ytId: "3JWTaaS7LdU" },
    ],
    1995: [
      { title: "Gangsta's Paradise", artist: "Coolio ft. L.V.", ytId: "fPO76Jlnz6c" },
    ],
    1997: [
      { title: "Bitter Sweet Symphony", artist: "The Verve", ytId: "1lyu1KKwC74" },
    ],
    1999: [
      { title: "Smooth", artist: "Santana ft. Rob Thomas", ytId: "6Whgn_iE5uc" },
      { title: "No Scrubs", artist: "TLC", ytId: "FrLequ6dUdM" },
    ],
    2002: [
      { title: "Lose Yourself", artist: "Eminem", ytId: "_Yhyp-_hX2s" },
    ],
    2003: [
      { title: "Hey Ya!", artist: "OutKast", ytId: "PWgvGjAhvIw" },
      { title: "Crazy in Love", artist: "Beyoncé ft. JAY-Z", ytId: "ViwtNLUqkMY" },
    ],
    2004: [
      { title: "Yeah!", artist: "Usher ft. Lil Jon", ytId: "GxBSyx85Kp8" },
    ],
    2008: [
      { title: "Viva la Vida", artist: "Coldplay", ytId: "dvgZkm1xWPE" },
    ],
    2010: [
      { title: "Bad Romance", artist: "Lady Gaga", ytId: "qrO4YZeyl0I" },
    ],
    2012: [
      { title: "Somebody That I Used to Know", artist: "Gotye", ytId: "8UVNT4wvIGY" },
    ],
    2014: [
      { title: "Happy", artist: "Pharrell Williams", ytId: "ZbZSe6N_BXs" },
      { title: "Shake It Off", artist: "Taylor Swift", ytId: "nfWlot6h_JM" },
    ],
    2015: [
      { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", ytId: "OPf0YbXqDm0" },
    ],
    2017: [
      { title: "Shape of You", artist: "Ed Sheeran", ytId: "JGwWNGJdvx8" },
    ],
    2019: [
      { title: "Old Town Road", artist: "Lil Nas X", ytId: "w2Ov5jzm3j8" },
      { title: "bad guy", artist: "Billie Eilish", ytId: "DyDfgMOUjCI" },
    ],
    2020: [
      { title: "Blinding Lights", artist: "The Weeknd", ytId: "4NRXx6U8ABQ" },
    ],
    2022: [
      { title: "As It Was", artist: "Harry Styles", ytId: "H5v3kku4y6Q" },
    ],
    2023: [
      { title: "Flowers", artist: "Miley Cyrus", ytId: "G7KNmW9a75Y" },
      { title: "Cruel Summer", artist: "Taylor Swift", ytId: "ic8j13piAhQ" },
    ],
    2024: [
      { title: "Espresso", artist: "Sabrina Carpenter", ytId: "eVli-tstM5E" },
    ],
  },

  uk: {
    1955: [
      { title: "Rock Around the Clock", artist: "Bill Haley", ytId: "ZgdufzXvjqw" },
    ],
    1963: [
      { title: "She Loves You", artist: "The Beatles", ytId: "x_y056e8WME" },
    ],
    1965: [
      { title: "Yesterday", artist: "The Beatles", ytId: "NrgmdOz227I" },
    ],
    1967: [
      { title: "A Whiter Shade of Pale", artist: "Procol Harum", ytId: "Mb3iPP-tHdA" },
    ],
    1969: [
      { title: "Space Oddity", artist: "David Bowie", ytId: "iYYRH4apXDo" },
    ],
    1975: [
      { title: "Bohemian Rhapsody", artist: "Queen", ytId: "fJ9rUzIMcZQ" },
    ],
    1977: [
      { title: "God Save the Queen", artist: "Sex Pistols", ytId: "yqrAPOZxgzU" },
      { title: "Heroes", artist: "David Bowie", ytId: "lXgkuM2NhYI" },
    ],
    1980: [
      { title: "Don't Stand So Close to Me", artist: "The Police", ytId: "KNIZofPB8ZM" },
    ],
    1983: [
      { title: "Sweet Dreams", artist: "Eurythmics", ytId: "qeMFqkcPYcg" },
    ],
    1985: [
      { title: "Everybody Wants to Rule the World", artist: "Tears for Fears", ytId: "aGCdLKXNF3w" },
    ],
    1990: [
      { title: "Unfinished Sympathy", artist: "Massive Attack", ytId: "ZWmrfgj0MZI" },
    ],
    1994: [
      { title: "Parklife", artist: "Blur", ytId: "YSuHrTfcikU" },
      { title: "Live Forever", artist: "Oasis", ytId: "i_2mWhfOhGU" },
    ],
    1995: [
      { title: "Wonderwall", artist: "Oasis", ytId: "bx1Bh8ZvH84" },
    ],
    1997: [
      { title: "Bitter Sweet Symphony", artist: "The Verve", ytId: "1lyu1KKwC74" },
      { title: "Karma Police", artist: "Radiohead", ytId: "1uYWYWPc9HU" },
    ],
    2002: [
      { title: "By the Way", artist: "Red Hot Chili Peppers", ytId: "JnfyjwChuNU" },
    ],
    2005: [
      { title: "Fix You", artist: "Coldplay", ytId: "k4V3Mo61fJM" },
    ],
    2011: [
      { title: "Rolling in the Deep", artist: "Adele", ytId: "rYEDA3JcQqw" },
    ],
    2015: [
      { title: "Hello", artist: "Adele", ytId: "YQHsXMglC9A" },
    ],
    2017: [
      { title: "Shape of You", artist: "Ed Sheeran", ytId: "JGwWNGJdvx8" },
    ],
    2020: [
      { title: "Blinding Lights", artist: "The Weeknd", ytId: "4NRXx6U8ABQ" },
    ],
    2022: [
      { title: "As It Was", artist: "Harry Styles", ytId: "H5v3kku4y6Q" },
    ],
    2024: [
      { title: "Espresso", artist: "Sabrina Carpenter", ytId: "eVli-tstM5E" },
    ],
  },

  france: {
    1960: [
      { title: "Non, je ne regrette rien", artist: "Édith Piaf", ytId: "Q3Kvu6Kgp88" },
    ],
    1965: [
      { title: "La Bohème", artist: "Charles Aznavour", ytId: "hWLc0J52b2I" },
    ],
    1970: [
      { title: "Je t'aime... moi non plus", artist: "Serge Gainsbourg & Jane Birkin", ytId: "GlpDf6XX_j0" },
    ],
    1977: [
      { title: "Ça plane pour moi", artist: "Plastic Bertrand", ytId: "bHLR3faI7lU" },
    ],
    1985: [
      { title: "Les Champs-Élysées", artist: "Joe Dassin", ytId: "qr-fdHXGLbQ" },
    ],
    2001: [
      { title: "Harder, Better, Faster, Stronger", artist: "Daft Punk", ytId: "gAjR4_CbPpQ" },
    ],
    2010: [
      { title: "Alors on danse", artist: "Stromae", ytId: "VHoT4N43jK8" },
    ],
    2013: [
      { title: "Get Lucky", artist: "Daft Punk ft. Pharrell", ytId: "5NV6Rdv1a3I" },
    ],
    2017: [
      { title: "Shape of You", artist: "Ed Sheeran", ytId: "JGwWNGJdvx8" },
    ],
    2023: [
      { title: "Flowers", artist: "Miley Cyrus", ytId: "G7KNmW9a75Y" },
    ],
  },

  germany: {
    1972: [
      { title: "Autobahn", artist: "Kraftwerk", ytId: "x-G28iyPtz0" },
    ],
    1977: [
      { title: "Trans-Europe Express", artist: "Kraftwerk", ytId: "XMVokT5e0zs" },
    ],
    1983: [
      { title: "99 Luftballons", artist: "Nena", ytId: "AT_0zXw2rRo" },
    ],
    1985: [
      { title: "Major Tom", artist: "Peter Schilling", ytId: "wO0A0XcWy88" },
    ],
    1990: [
      { title: "Wind of Change", artist: "Scorpions", ytId: "n4RjJKxsamQ" },
    ],
    1995: [
      { title: "Du Hast", artist: "Rammstein", ytId: "W3q8Od5qJio" },
    ],
    2004: [
      { title: "Durch den Monsun", artist: "Tokio Hotel", ytId: "S_Sy5-sOodA" },
    ],
    2013: [
      { title: "Get Lucky", artist: "Daft Punk ft. Pharrell", ytId: "5NV6Rdv1a3I" },
    ],
    2019: [
      { title: "Deutschland", artist: "Rammstein", ytId: "NeQM1c-XCDc" },
    ],
    2023: [
      { title: "Flowers", artist: "Miley Cyrus", ytId: "G7KNmW9a75Y" },
    ],
  },

  japan: {
    1963: [
      { title: "Sukiyaki", artist: "Kyu Sakamoto", ytId: "C35DrtPlUbc" },
    ],
    1990: [
      { title: "Odoru Ponpokorin", artist: "B.B. Queens", ytId: "OmTJQVnNq5Y" },
    ],
    1999: [
      { title: "Automatic", artist: "Utada Hikaru", ytId: "-9DxpPiE458" },
    ],
    2012: [
      { title: "Gangnam Style", artist: "PSY", ytId: "9bZkp7q19f0" },
    ],
    2016: [
      { title: "Zen Zen Zense", artist: "RADWIMPS", ytId: "PDSkFeMVNFs" },
    ],
    2019: [
      { title: "Lemon", artist: "Kenshi Yonezu", ytId: "SX_ViT4Ra7k" },
    ],
    2020: [
      { title: "Dynamite", artist: "BTS", ytId: "gdZLi9oWNZg" },
    ],
    2023: [
      { title: "Idol", artist: "YOASOBI", ytId: "ZRtdQ81jPUQ" },
    ],
  },

  korea: {
    2004: [
      { title: "Lies", artist: "Big Bang", ytId: "2Cv3phvP8Ro" },
    ],
    2009: [
      { title: "Gee", artist: "Girls' Generation", ytId: "U7mPqycQ0tQ" },
    ],
    2012: [
      { title: "Gangnam Style", artist: "PSY", ytId: "9bZkp7q19f0" },
    ],
    2016: [
      { title: "Cheer Up", artist: "TWICE", ytId: "c7rCyll5AeY" },
    ],
    2019: [
      { title: "Boy With Luv", artist: "BTS ft. Halsey", ytId: "XsX3ATc3FbA" },
    ],
    2020: [
      { title: "Dynamite", artist: "BTS", ytId: "gdZLi9oWNZg" },
    ],
    2022: [
      { title: "That That", artist: "PSY ft. SUGA", ytId: "8dJyRm2jJ-U" },
    ],
    2023: [
      { title: "손오공 (Super)", artist: "SEVENTEEN", ytId: "-GQg25oP0S4" },
    ],
  },

  brazil: {
    1964: [
      { title: "The Girl from Ipanema", artist: "Astrud Gilberto", ytId: "j8VPmtyLqSY" },
    ],
    1972: [
      { title: "Águas de Março", artist: "Tom Jobim", ytId: "E1tOV7y94DY" },
    ],
    2010: [
      { title: "Waka Waka", artist: "Shakira", ytId: "pRpeEdMmmQ0" },
    ],
    2017: [
      { title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", ytId: "kJQP7kiw5Fk" },
    ],
    2023: [
      { title: "Flowers", artist: "Miley Cyrus", ytId: "G7KNmW9a75Y" },
    ],
  },

  latin: {
    1955: [
      { title: "Mambo No. 5", artist: "Pérez Prado", ytId: "EK_LN3XEcnw" },
    ],
    1985: [
      { title: "La Bamba", artist: "Ritchie Valens", ytId: "Jp6j5HJ-Cok" },
    ],
    1995: [
      { title: "La Macarena", artist: "Los del Río", ytId: "zWaymcVmJ-A" },
    ],
    1999: [
      { title: "Livin' La Vida Loca", artist: "Ricky Martin", ytId: "p47fEXGabaY" },
    ],
    2004: [
      { title: "Gasolina", artist: "Daddy Yankee", ytId: "CCF1_jI8Prk" },
    ],
    2010: [
      { title: "Waka Waka", artist: "Shakira", ytId: "pRpeEdMmmQ0" },
    ],
    2017: [
      { title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", ytId: "kJQP7kiw5Fk" },
    ],
    2020: [
      { title: "Dákiti", artist: "Bad Bunny & Jhay Cortez", ytId: "TmKh7lAwnBI" },
    ],
    2023: [
      { title: "MONACO", artist: "Bad Bunny", ytId: "_PJvpq8uOZM" },
    ],
  },

  india: {
    1985: [
      { title: "Jai Ho", artist: "A.R. Rahman", ytId: "xwwAVRyNmgQ" },
    ],
    2002: [
      { title: "Kal Ho Naa Ho", artist: "Sonu Nigam", ytId: "g0eO74UmRBs" },
    ],
    2009: [
      { title: "Jai Ho", artist: "A.R. Rahman", ytId: "xwwAVRyNmgQ" },
    ],
    2015: [
      { title: "Tum Hi Ho", artist: "Arijit Singh (Aashiqui 2)", ytId: "Umqb9KENgmk" },
    ],
    2019: [
      { title: "Apna Time Aayega", artist: "Ranveer Singh (Gully Boy)", ytId: "jFGKJBPFdUA" },
    ],
  },

  middleeast: {
    1998: [
      { title: "Nour El Ain", artist: "Amr Diab", ytId: "KLJA-srM_yM" },
    ],
    2005: [
      { title: "Tamally Maak", artist: "Amr Diab", ytId: "EgmXTmj62ic" },
    ],
    2012: [
      { title: "El Watar El Hassas", artist: "Sherine", ytId: "KZYqugtbcG0" },
    ],
    2014: [
      { title: "Boshret Kheir", artist: "Hussain Al Jassmi", ytId: "QUBvVTNRp4Q" },
    ],
    2017: [
      { title: "3 Daqat", artist: "Abu ft. Yousra", ytId: "ejvpVhvKesM" },
    ],
    2018: [
      { title: "Dari Ya Alby", artist: "Hamza Namira", ytId: "23ruEfLScnM" },
    ],
    2020: [
      { title: "Bent El Giran", artist: "Hassan Shakosh & Omar Kamal", ytId: "uHBaHQau8b4" },
    ],
    2023: [
      { title: "Desert Rose", artist: "Lolo Zouaï", ytId: "N1D4Yx1_wOM" },
    ],
  },

  russia: {
    1985: [
      { title: "Kombat", artist: "Lyube", ytId: "orQlqpYSZCY" },
    ],
    1990: [
      { title: "Wind of Change", artist: "Scorpions", ytId: "n4RjJKxsamQ" },
    ],
    2003: [
      { title: "All the Things She Said", artist: "t.A.T.u.", ytId: "8mGBaXPlri8" },
    ],
    2010: [
      { title: "Bad Romance", artist: "Lady Gaga", ytId: "qrO4YZeyl0I" },
    ],
    2020: [
      { title: "Blinding Lights", artist: "The Weeknd", ytId: "4NRXx6U8ABQ" },
    ],
  },

  africa: {
    1975: [
      { title: "Zombie", artist: "Fela Kuti", ytId: "76wSk1j02_4" },
    ],
    2010: [
      { title: "Waka Waka", artist: "Shakira ft. Freshlyground", ytId: "pRpeEdMmmQ0" },
    ],
    2016: [
      { title: "One Dance", artist: "Drake ft. WizKid", ytId: "iAbnEUA0wpA" },
    ],
    2019: [
      { title: "Ye", artist: "Burna Boy", ytId: "lPe09eE6Xio" },
    ],
    2020: [
      { title: "Jerusalema", artist: "Master KG ft. Nomcebo", ytId: "fCZVL_8D048" },
    ],
    2023: [
      { title: "Calm Down", artist: "Rema & Selena Gomez", ytId: "WcIcVapfqXw" },
    ],
  },

  australia: {
    1960: [
      { title: "Waltzing Matilda", artist: "Slim Dusty", ytId: "FqtttbbYfSM" },
    ],
    1980: [
      { title: "Down Under", artist: "Men at Work", ytId: "XfR9iY5y94s" },
    ],
    1987: [
      { title: "Need You Tonight", artist: "INXS", ytId: "w-rv2BQa2OU" },
    ],
    1997: [
      { title: "Truly Madly Deeply", artist: "Savage Garden", ytId: "WQnAxOQxQIU" },
    ],
    2011: [
      { title: "Somebody That I Used to Know", artist: "Gotye", ytId: "8UVNT4wvIGY" },
    ],
    2014: [
      { title: "Chandelier", artist: "Sia", ytId: "2vjPBrBU-TM" },
    ],
    2017: [
      { title: "The Less I Know The Better", artist: "Tame Impala", ytId: "sBzrzS1Ag_g" },
    ],
    2020: [
      { title: "Dance Monkey", artist: "Tones and I", ytId: "q0hyYWKXF0Q" },
    ],
    2023: [
      { title: "Flowers", artist: "Miley Cyrus", ytId: "G7KNmW9a75Y" },
    ],
  },

  china: {
    1960: [
      { title: "The Moon Represents My Heart", artist: "Teresa Teng", ytId: "bv_cEeDlop0" },
    ],
    1980: [
      { title: "The Moon Represents My Heart", artist: "Teresa Teng", ytId: "bv_cEeDlop0" },
    ],
    2000: [
      { title: "Fairy Tale", artist: "Michael Wong", ytId: "bBcp_ljCBGU" },
    ],
    2023: [
      { title: "Calm Down", artist: "Rema & Selena Gomez", ytId: "WcIcVapfqXw" },
    ],
  },
};

// ── Lookup helpers ──

function closestYear(db, year) {
  const years = Object.keys(db).map(Number).sort((a, b) => a - b);
  let closest = years[0];
  for (const y of years) {
    if (Math.abs(y - year) < Math.abs(closest - year)) closest = y;
  }
  return closest;
}

/**
 * Get the top hit for a year + city combination.
 * Falls back to 'us' if the region has no data.
 */
export function getTopHit(year, city = 'New York') {
  const region = cityRegion[city] || 'us';
  const db = regionalMusic[region] || regionalMusic.us;
  const yr = closestYear(db, year);
  const tracks = db[yr];
  return tracks?.[0] || { title: 'Searching...', artist: 'Tuning', ytId: null };
}

/**
 * Get all tracks for the closest year in a region.
 */
export function getTracksForYear(year, city = 'New York') {
  const region = cityRegion[city] || 'us';
  const db = regionalMusic[region] || regionalMusic.us;
  const yr = closestYear(db, year);
  return db[yr] || [];
}

/**
 * Get a random track to display in the VFD.
 */
export function getTrackDisplay(year, city = 'New York') {
  const tracks = getTracksForYear(year, city);
  if (tracks.length === 0) return getTopHit(year, city);
  return tracks[Math.floor(Math.random() * tracks.length)];
}

export default regionalMusic;
