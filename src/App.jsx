import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";

/* ============================================================
   THE PATHFINDER INDEX · A DEEP TIME SURVEY
   Black / White / International Klein Blue
   Druk Wide (titles) · Favorit (body) with free fallbacks
   Imagery served from Deep Time's Cloudinary library.
   ============================================================ */

const IKB = "#002FA7";
const SIGNAL = "#2E5BFF";

/* ---------- Cloudinary ----------
   Images are looked up by each entry's name, lowercased with underscores
   (e.g. TEENAGE ENGINEERING -> teenage_engineering). Upload an image with
   that public ID and it appears automatically; until then the entry shows
   its sigil. An entry can override its image name via the img field. */
const CLOUD_NAME = "df9vuqda1";

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/\u0153/g, "oe")
    .replace(/\u00f8/g, "o")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const CLOUD_FOLDER = ""; // images are at the root of the media library

const CLOUD_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,c_fill,g_auto,w_640,h_800`;

/* Each entry tries its image inside the folder first, then at the root,
   then falls back to its sigil. */
const imgCandidates = (entry) => {
  const id = entry.img || slug(entry.name);
  const list = [];
  if (CLOUD_FOLDER) list.push(`${CLOUD_BASE}/${CLOUD_FOLDER}/${id}`);
  list.push(`${CLOUD_BASE}/${id}`);
  return list;
};

const DIMENSIONS = [
  { key: "v", label: "VISION", weight: 0.25, desc: "Clarity of the future they see" },
  { key: "i", label: "IMPACT", weight: 0.20, desc: "Scale of the change they intend" },
  { key: "b", label: "BENEFIT", weight: 0.25, desc: "How positive that change is for humanity" },
  { key: "s", label: "SIGNAL", weight: 0.15, desc: "How well they tell the story" },
  { key: "p", label: "BELIEF", weight: 0.15, desc: "How strongly the public believes" },
];

const TIERS = [
  { name: "PATHFINDER", min: 8.5, desc: "Setting the route for everyone else" },
  { name: "NAVIGATOR", min: 7.0, desc: "Steering with intent" },
  { name: "EXPLORER", min: 5.5, desc: "Searching for the path" },
  { name: "PASSENGER", min: 0, desc: "Along for the ride" },
];

const SECTORS = [
  { id: "ai", label: "AI & COMPUTE" },
  { id: "space", label: "SPACE" },
  { id: "biotech", label: "BIO & HEALTH" },
  { id: "energy", label: "ENERGY & CLIMATE" },
  { id: "science", label: "SCIENCE" },
  { id: "culture", label: "CULTURE & ARTS" },
  { id: "music", label: "MUSIC & SOUND" },
  { id: "design", label: "DESIGN" },
  { id: "deeptech", label: "DEEP TECH" },
  { id: "education", label: "EDUCATION" },
  { id: "finance", label: "COMMERCE & IMPACT" },
];

/* name, sector, v(ision), i(mpact), b(enefit), s(ignal), p(belief), description, url, wiki title */
const E = (name, sector, v, i, b, s, p, desc, url, wiki, img) => ({
  name, sector, v, i, b, s, p, desc,
  url: url || null,
  wiki: wiki || name,
  img: img || null,
});

const ENTRIES = [
  /* ---- AI & COMPUTE ---- */
  E("ANTHROPIC", "ai", 9.5, 9.5, 9.0, 8.0, 8.0, "American AI safety company founded in 2021 by former OpenAI researchers, and the developer of the Claude family of AI models. Its research focuses on making AI systems reliable, interpretable and steerable.", "https://www.anthropic.com", "Anthropic"),
  E("DEEPMIND", "ai", 9.0, 9.5, 9.0, 7.5, 8.0, "British-American AI laboratory founded in London in 2010 and now part of Google. Its AlphaFold system predicted the structures of over 200 million proteins, a landmark contribution to biology.", "https://deepmind.google", "Google DeepMind"),
  E("NVIDIA", "ai", 8.5, 9.5, 7.5, 8.0, 8.0, "American technology company founded in 1993 whose graphics processors became the standard hardware for training modern AI systems, making it one of the most valuable companies in the world.", "https://www.nvidia.com", "Nvidia"),
  E("OPENAI", "ai", 8.5, 9.5, 7.0, 8.5, 6.5, "American AI company founded in 2015 and the developer of ChatGPT, the GPT models and the Sora video generator. Began as a non-profit and has since restructured around a for-profit arm.", "https://openai.com", "OpenAI"),
  E("HUGGING FACE", "ai", 8.0, 8.0, 8.5, 7.0, 8.0, "American-French company that hosts the leading open platform for sharing machine learning models and datasets. Its open-source libraries, including Transformers, are foundational to modern AI development.", "https://huggingface.co", "Hugging Face"),
  E("AI2", "ai", 8.0, 8.0, 9.0, 6.0, 7.0, "Non-profit AI research institute founded in Seattle in 2014 by Paul Allen. Releases fully open language models and tools, including the OLMo family, for scientific and public use.", "https://allenai.org", "Allen Institute for AI"),
  E("MISTRAL", "ai", 7.5, 8.0, 7.5, 6.0, 7.0, "French AI company founded in Paris in 2023 by former DeepMind and Meta researchers, releasing open-weight large language models. Widely seen as Europe's leading frontier AI lab.", "https://mistral.ai", "Mistral AI"),
  E("RUNWAY", "ai", 7.5, 8.0, 7.0, 8.0, 7.0, "New York research company building generative AI tools for video and film, including the Gen series of video models. Its tools have been used in feature films and music videos.", "https://runwayml.com", "Runway (company)"),
  E("COHERE", "ai", 7.0, 7.5, 7.5, 5.5, 6.5, "Canadian AI company founded in Toronto in 2019 by former Google researchers, building large language models aimed at enterprise and business use.", "https://cohere.com", "Cohere"),
  E("MIDJOURNEY", "ai", 7.0, 8.0, 6.5, 6.5, 6.5, "Independent San Francisco research lab behind one of the most widely used AI image generators, run as a small self-funded team founded by David Holz in 2021.", "https://www.midjourney.com", "Midjourney"),

  /* ---- SPACE ---- */
  E("SPACEX", "space", 9.5, 10, 7.5, 8.5, 7.5, "American aerospace company founded by Elon Musk in 2002 with the stated goal of making humanity multiplanetary. Developed the first orbital-class reusable rockets and operates the Starlink satellite network.", "https://www.spacex.com", "SpaceX"),
  E("NASA", "science", 8.5, 9.5, 9.0, 9.5, 9.5, "The United States' civil space agency, founded in 1958 and responsible for the Apollo Moon landings, the Space Shuttle, the James Webb Space Telescope and the Artemis programme returning humans to the Moon.", "https://www.nasa.gov", "NASA"),
  E("ESA", "space", 8.0, 9.0, 9.0, 6.5, 8.0, "The intergovernmental space agency of more than 20 European states, founded in 1975 and headquartered in Paris. Its work spans Earth observation, the Ariane launchers and deep-space science missions such as Juice and Gaia.", "https://www.esa.int", "European Space Agency"),
  E("ROCKET LAB", "space", 8.0, 8.0, 7.5, 6.5, 7.5, "American-New Zealand launch company founded by Peter Beck in 2006, whose Electron became one of the most frequently flown small rockets. Now developing the larger reusable Neutron launcher.", "https://www.rocketlabusa.com", "Rocket Lab"),
  E("PLANET LABS", "space", 8.0, 8.0, 8.5, 7.0, 7.0, "American Earth-imaging company founded by former NASA engineers in 2010. Operates the largest fleet of Earth-observation satellites and images the planet's entire landmass every day.", "https://www.planet.com", "Planet Labs"),
  E("RELATIVITY SPACE", "space", 8.0, 8.5, 7.0, 7.5, 6.5, "Los Angeles launch company founded in 2015 and known for 3D printing the majority of its rockets. Flew Terran 1, the first largely 3D-printed rocket, in 2023 and is developing the reusable Terran R.", "https://www.relativityspace.com", "Relativity Space"),
  E("STOKE SPACE", "space", 8.0, 8.5, 7.5, 6.5, 6.5, "Seattle-area launch company founded in 2020 by Blue Origin and SpaceX veterans, developing Nova, a rocket designed to be fully and rapidly reusable from first stage to second.", "https://www.stokespace.com", "Stoke Space"),
  E("VARDA", "space", 7.5, 8.0, 7.5, 7.0, 6.0, "Californian company founded in 2021 to manufacture pharmaceuticals in microgravity and return them to Earth in re-entry capsules. Has completed its first in-space drug processing missions.", "https://www.varda.com", "Varda Space Industries"),
  E("BLUE ORIGIN", "space", 7.5, 9.0, 7.0, 6.0, 5.5, "Aerospace company founded by Jeff Bezos in 2000 with the long-term vision of millions of people living and working in space. Flies the suborbital New Shepard and the orbital New Glenn rocket.", "https://www.blueorigin.com", "Blue Origin"),
  E("ASTRA", "space", 6.5, 7.5, 6.5, 5.5, 5.0, "Californian small-launch company founded in 2016 that reached orbit in 2021 but struggled with reliability and finances, later refocusing on spacecraft engines and going private.", "https://astra.com", "Astra Space"),

  /* ---- BIO & HEALTH ---- */
  E("MSF", "biotech", 9.0, 9.0, 10, 8.0, 9.0, "Médecins Sans Frontières, the international humanitarian medical organisation founded in Paris in 1971. Delivers emergency care in conflict zones, epidemics and disasters, and was awarded the Nobel Peace Prize in 1999.", "https://www.msf.org", "Médecins Sans Frontières"),
  E("BIONTECH", "biotech", 9.0, 9.0, 9.5, 7.0, 8.0, "German biotechnology company founded in Mainz in 2008, which developed the first approved mRNA vaccine with Pfizer during the COVID-19 pandemic. Now focused on mRNA-based cancer immunotherapies.", "https://www.biontech.com", "BioNTech"),
  E("ISOMORPHIC LABS", "biotech", 8.5, 9.0, 9.0, 6.5, 7.0, "London drug discovery company spun out of DeepMind in 2021, applying AlphaFold-derived AI to the design of new medicines. Led by DeepMind co-founder Demis Hassabis.", "https://www.isomorphiclabs.com", "Isomorphic Labs"),
  E("NEURALINK", "biotech", 8.5, 9.5, 7.0, 7.5, 6.0, "American neurotechnology company founded by Elon Musk in 2016, developing implantable brain-computer interfaces. Began first-in-human trials of its implant in 2024.", "https://neuralink.com", "Neuralink"),
  E("CRISPR THERAPEUTICS", "biotech", 8.0, 9.0, 9.0, 6.5, 7.0, "Swiss-American gene-editing company co-founded by Nobel laureate Emmanuelle Charpentier. Its therapy Casgevy, approved in 2023 for sickle cell disease, was the first CRISPR-based medicine to reach patients.", "https://www.crisprtx.com", "CRISPR Therapeutics"),
  E("RECURSION", "biotech", 8.0, 8.5, 8.5, 7.0, 6.5, "Salt Lake City biotechnology company founded in 2013, using automated experiments and machine learning to map cellular biology and discover drugs at industrial scale.", "https://www.recursion.com", "Recursion Pharmaceuticals"),
  E("MODERNA", "biotech", 8.0, 8.5, 8.5, 7.5, 6.5, "American biotechnology company founded in 2010, a pioneer of messenger RNA medicine and maker of one of the principal COVID-19 vaccines. Developing mRNA treatments for cancer, flu and rare disease.", "https://www.modernatx.com", "Moderna"),
  E("COLOSSAL", "biotech", 7.5, 9.0, 6.5, 8.5, 6.0, "Texas biosciences company founded in 2021, applying gene editing to de-extinction projects including the woolly mammoth, thylacine and dodo, alongside conservation biotechnology for endangered species.", "https://colossal.com", "Colossal Biosciences"),
  E("23ANDME", "biotech", 5.5, 7.0, 6.0, 6.0, 4.0, "Californian consumer genetics company founded in 2006 that brought DNA testing to the mass market. Later suffered a major data breach and financial collapse, filing for bankruptcy protection in 2025.", "https://www.23andme.com", "23andMe"),

  /* ---- ENERGY & CLIMATE ---- */
  E("PATAGONIA", "energy", 9.5, 8.5, 9.5, 9.0, 9.5, "American outdoor clothing company founded by Yvon Chouinard in 1973. In 2022 ownership was transferred to a trust and non-profit so that all profits fund climate action, with Earth described as the company's only shareholder.", "https://www.patagonia.com", "Patagonia, Inc."),
  E("COMMONWEALTH FUSION", "energy", 9.0, 9.5, 9.5, 7.0, 7.0, "MIT spin-out founded in 2018, building SPARC, a compact tokamak intended to demonstrate net-energy fusion. Backed by some of the largest private investment in fusion energy.", "https://cfs.energy", "Commonwealth Fusion Systems"),
  E("THE OCEAN CLEANUP", "energy", 8.5, 8.5, 9.0, 8.5, 8.0, "Dutch non-profit founded by Boyan Slat in 2013, developing systems to remove plastic from the Great Pacific Garbage Patch and to intercept it in rivers before it reaches the sea.", "https://theoceancleanup.com", "The Ocean Cleanup"),
  E("ØRSTED", "energy", 8.5, 8.5, 9.0, 7.5, 7.5, "Danish energy company, formerly the oil and gas firm DONG Energy, which transformed itself into the world's largest developer of offshore wind power.", "https://orsted.com", "Ørsted (company)"),
  E("CLIMEWORKS", "energy", 8.5, 8.5, 9.0, 7.0, 7.0, "Swiss company founded in 2009, operating the world's first commercial direct air capture plants in Iceland, which remove carbon dioxide from the atmosphere for permanent storage underground.", "https://climeworks.com", "Climeworks"),
  E("FORM ENERGY", "energy", 8.5, 8.5, 9.0, 6.5, 7.0, "American battery company founded in 2017, developing iron-air batteries that can store energy for several days at a time, aimed at making renewable electricity grids reliable.", "https://formenergy.com", "Form Energy"),
  E("TESLA", "energy", 8.5, 9.5, 8.0, 8.0, 5.5, "American electric vehicle and energy company led by Elon Musk, which brought EVs to the mass market and builds grid-scale battery storage and solar products.", "https://www.tesla.com", "Tesla, Inc."),
  E("HELION", "energy", 8.0, 9.0, 9.0, 7.0, 6.5, "Washington-state fusion company founded in 2013, developing a pulsed fusion generator. Holds a power purchase agreement with Microsoft, the first of its kind for fusion electricity.", "https://www.helionenergy.com", "Helion Energy"),
  E("OCTOPUS ENERGY", "energy", 8.0, 8.0, 8.5, 7.5, 8.0, "British renewable energy company founded in 2015, one of the UK's largest household suppliers. Its Kraken software platform is licensed to utilities around the world.", "https://octopus.energy", "Octopus Energy"),
  E("INTERFACE", "energy", 8.0, 7.5, 8.5, 7.0, 7.0, "American modular flooring manufacturer that became a landmark of industrial sustainability under founder Ray Anderson, completing its Mission Zero programme in 2019 and now selling carbon-negative carpet tiles.", "https://www.interface.com", "Interface, Inc."),
  E("ECOSIA", "energy", 7.5, 7.0, 8.5, 7.5, 8.0, "Berlin-based search engine founded in 2009 that uses its advertising profits to fund tree planting, with more than 200 million trees planted across the world to date.", "https://www.ecosia.org", "Ecosia"),
  E("RIVIAN", "energy", 7.5, 7.5, 8.0, 7.5, 6.5, "American electric vehicle maker founded in 2009, producing adventure-focused trucks and SUVs as well as the electric delivery vans originally developed for Amazon.", "https://rivian.com", "Rivian"),

  /* ---- SCIENCE ---- */
  E("CERN", "science", 9.0, 9.5, 9.5, 7.0, 8.5, "The European Organization for Nuclear Research, founded in 1954 near Geneva, operates the Large Hadron Collider, where the Higgs boson was discovered in 2012. The World Wide Web was invented there in 1989.", "https://home.cern", "CERN"),
  E("LONG NOW FOUNDATION", "science", 9.5, 7.5, 9.0, 8.0, 8.0, "San Francisco foundation established in 1996 to foster long-term thinking. Best known for building a monumental clock inside a Texas mountain, designed to keep time for 10,000 years.", "https://longnow.org", "Long Now Foundation"),
  E("ITER", "science", 8.5, 9.5, 9.5, 6.0, 7.0, "International fusion megaproject under construction in southern France, in which 35 nations are collaborating to build the world's largest tokamak and demonstrate fusion power at industrial scale.", "https://www.iter.org", "ITER"),
  E("ARC INSTITUTE", "science", 8.5, 8.5, 9.0, 6.5, 7.0, "Palo Alto research institute founded in 2021 in partnership with Stanford, Berkeley and UCSF, giving scientists long-term core funding to pursue curiosity-driven biomedical research.", "https://arcinstitute.org", "Arc Institute"),
  E("ALLEN INSTITUTE", "science", 8.5, 8.5, 9.0, 6.0, 7.0, "Seattle non-profit research institute founded by Paul Allen in 2003, producing open atlases of the brain, the cell and the immune system that are shared freely with science.", "https://alleninstitute.org", "Allen Institute"),
  E("SANTA FE INSTITUTE", "science", 8.5, 8.0, 8.5, 5.5, 7.0, "Independent New Mexico research institute founded in 1984 and the home of complexity science, studying common patterns across physical, biological and social systems.", "https://www.santafe.edu", "Santa Fe Institute"),
  E("MIT MEDIA LAB", "science", 8.0, 8.0, 8.0, 7.0, 6.0, "Interdisciplinary research laboratory at MIT, founded in 1985 and known for work spanning wearable computing, learning technology, robotics and digital interfaces.", "https://www.media.mit.edu", "MIT Media Lab"),

  E("KEW GARDENS", "science", 8.5, 8.0, 9.5, 7.5, 9.0, "The Royal Botanic Gardens at Kew, a London scientific institution whose Millennium Seed Bank safeguards billions of seeds from the world's wild plants against extinction.", "https://www.kew.org", "Royal Botanic Gardens, Kew"),
  E("NATURAL HISTORY MUSEUM", "science", 8.0, 7.5, 9.0, 8.0, 9.0, "London museum housing 80 million specimens and a leading research centre on biodiversity, whose Urban Nature Project has rewilded its own five-acre gardens.", "https://www.nhm.ac.uk", "Natural History Museum, London"),
  E("FRANCIS CRICK INSTITUTE", "science", 8.0, 8.0, 9.0, 6.5, 7.5, "Europe's largest biomedical laboratory under one roof, opened in London in 2016, where more than 2,000 scientists study the biology of health and disease.", "https://www.crick.ac.uk", "Francis Crick Institute"),
  E("MAX PLANCK SOCIETY", "science", 8.5, 9.0, 9.0, 6.0, 8.0, "Germany's network of more than 80 basic research institutes, whose scientists have won dozens of Nobel Prizes for work spanning gravitational waves to ancient DNA.", "https://www.mpg.de", "Max Planck Society"),
  E("BROAD INSTITUTE", "science", 8.5, 8.5, 9.0, 6.5, 7.5, "Genomic research institute of MIT and Harvard founded in 2004, a leader in CRISPR gene editing and in sharing large-scale genomic data openly for medicine.", "https://www.broadinstitute.org", "Broad Institute"),
  E("ALAN TURING INSTITUTE", "science", 8.0, 7.5, 8.5, 6.5, 7.0, "The UK's national institute for data science and artificial intelligence, founded in 2015 and named after the founder of computer science.", "https://www.turing.ac.uk", "Alan Turing Institute"),
  E("SETI INSTITUTE", "science", 8.5, 7.0, 8.0, 7.5, 7.5, "Californian research institute founded in 1984, searching for life and intelligence beyond Earth with radio telescopes, AI and planetary science.", "https://www.seti.org", "SETI Institute"),
  E("ROYAL INSTITUTION", "science", 8.0, 7.0, 8.5, 7.5, 8.0, "London home of science communication since 1799, where Faraday lectured and ten chemical elements were discovered, and whose Christmas Lectures have run since 1825.", "https://www.rigb.org", "Royal Institution"),
  E("PERIMETER INSTITUTE", "science", 8.0, 7.5, 8.5, 6.0, 7.0, "Independent Canadian centre for theoretical physics founded in 1999, probing quantum gravity and the foundations of the universe while sharing its training freely online.", "https://perimeterinstitute.ca", "Perimeter Institute"),

  /* ---- CULTURE & ARTS ---- */
  E("STUDIO GHIBLI", "culture", 8.5, 7.5, 9.0, 9.5, 9.5, "Japanese animation studio founded in 1985 by Hayao Miyazaki, Isao Takahata and Toshio Suzuki. Creator of Spirited Away, My Neighbour Totoro and Princess Mononoke.", "https://www.ghibli.jp", "Studio Ghibli"),
  E("TATE MODERN", "culture", 8.5, 8.0, 8.5, 8.0, 8.5, "Britain's national museum of modern and contemporary art, opened in a converted Bankside power station in 2000 and consistently among the most visited art museums in the world.", "https://www.tate.org.uk", "Tate Modern"),
  E("TEAMLAB", "culture", 8.5, 8.0, 8.0, 8.5, 8.5, "Tokyo art collective founded in 2001, creating immersive digital installations and the permanent Borderless and Planets museums, which draw millions of visitors a year.", "https://www.teamlab.art", "TeamLab (art collective)"),
  E("A24", "culture", 8.0, 7.0, 8.0, 9.5, 9.0, "Independent New York film studio founded in 2012, producer and distributor of Moonlight, Everything Everywhere All at Once and Past Lives, and winner of multiple Best Picture Oscars.", "https://a24films.com", "A24"),
  E("MOMA", "culture", 8.0, 7.5, 8.5, 8.0, 8.5, "The Museum of Modern Art in New York, founded in 1929, holds one of the most influential collections of modern and contemporary art in the world.", "https://www.moma.org", "Museum of Modern Art"),
  E("V&A", "culture", 8.0, 7.5, 8.5, 7.5, 8.5, "London's Victoria and Albert Museum, founded in 1852, is the world's largest museum of applied arts, decorative arts and design, with a collection spanning 5,000 years.", "https://www.vam.ac.uk", "Victoria and Albert Museum"),
  E("SERPENTINE", "culture", 8.0, 7.5, 8.0, 8.0, 8.0, "Pair of contemporary art galleries in London's Kensington Gardens, known for free exhibitions, a pioneering arts and technology programme and the annual Serpentine Pavilion architecture commission.", "https://www.serpentinegalleries.org", "Serpentine Galleries"),
  E("PUNCHDRUNK", "culture", 8.0, 7.0, 7.5, 8.5, 8.0, "British theatre company founded in 2000 that pioneered large-scale immersive theatre, including Sleep No More, in which audiences roam freely through the performance.", "https://www.punchdrunk.com", "Punchdrunk"),
  E("FACTORY INTERNATIONAL", "culture", 8.0, 7.5, 8.0, 7.5, 7.0, "Manchester arts organisation behind the Manchester International Festival and Aviva Studios, a landmark venue for commissioning new work that opened in 2023.", "https://factoryinternational.org", "Factory International"),
  E("GLASTONBURY", "music", 7.5, 7.0, 8.0, 8.0, 8.5, "The world's largest greenfield music and performing arts festival, held on a Somerset farm since 1970 and run by the Eavis family, with long-standing environmental commitments.", "https://www.glastonburyfestivals.co.uk", "Glastonbury Festival"),
  E("PALACE", "culture", 7.5, 6.5, 7.0, 8.5, 8.5, "London skateboard and clothing brand founded in 2009 by Lev Tanju, which grew from a skate crew into one of streetwear's most influential labels while remaining independent.", "https://www.palaceskateboards.com", "Palace Skateboards"),
  E("LEICA", "culture", 7.5, 6.5, 7.5, 8.0, 8.5, "German camera manufacturer based in Wetzlar whose 35mm cameras shaped a century of photojournalism, from Henri Cartier-Bresson onwards.", "https://leica-camera.com", "Leica Camera"),
  E("BARBICAN", "culture", 7.5, 7.0, 8.0, 7.5, 8.0, "Europe's largest multi-arts centre, opened in the City of London in 1982 within a celebrated Brutalist estate, housing concert halls, theatres, cinemas, galleries and a conservatory.", "https://www.barbican.org.uk", "Barbican Centre"),
  E("MEOW WOLF", "culture", 7.5, 7.0, 7.5, 8.0, 7.5, "American arts company that began as a Santa Fe collective in 2008, building permanent immersive art installations such as House of Eternal Return. Structured as a certified B Corporation.", "https://meowwolf.com", "Meow Wolf"),

  E("YAYOI KUSAMA", "culture", 8.0, 7.0, 8.0, 9.5, 9.0, "Japanese artist whose infinity mirror rooms and polka-dot universes made her the world's most popular living artist, drawing record crowds across continents.", null, "Yayoi Kusama"),
  E("JAMES TURRELL", "culture", 9.0, 7.0, 8.0, 8.0, 8.0, "American artist who works with light and space, transforming Roden Crater, an extinct Arizona volcano, into a monumental naked-eye observatory five decades in the making.", null, "James Turrell"),
  E("OLAFUR ELIASSON", "culture", 9.0, 8.0, 8.5, 8.5, 8.0, "Danish-Icelandic artist whose installations bring natural phenomena into galleries and cities, from the weather project at Tate Modern to Ice Watch, and whose Little Sun project distributes solar light.", "https://olafureliasson.net", "Olafur Eliasson"),
  E("ES DEVLIN", "culture", 8.5, 7.5, 8.0, 8.5, 7.5, "British artist and stage designer creating monumental illuminated sculptures and stadium worlds, from Beyonce tours to installations celebrating London's endangered species.", "https://esdevlin.com", "Es Devlin"),
  E("REFIK ANADOL", "culture", 8.0, 7.5, 7.0, 9.0, 7.5, "Turkish-American media artist who turns vast datasets into living architectural canvases, and whose work Unsupervised filled MoMA's lobby with machine dreams of its own collection.", "https://refikanadol.com", "Refik Anadol"),
  E("TOM\u00c1S SARACENO", "culture", 8.5, 7.0, 8.0, 8.0, 7.0, "Argentine artist whose Aerocene project develops fossil-free flight with solar balloons, and whose installations built with living spider webs reframe humanity's place among species.", "https://tomassaraceno.com", "Tom\u00e1s Saraceno"),
  E("STUDIO DRIFT", "culture", 8.0, 7.0, 7.5, 8.5, 7.5, "Amsterdam studio of Lonneke Gordijn and Ralph Nauta, choreographing drone swarms and kinetic sculptures that put technology in dialogue with nature.", "https://www.studiodrift.com", "Studio Drift"),
  E("RANDOM INTERNATIONAL", "culture", 7.5, 6.5, 7.5, 8.5, 7.5, "London art collective best known for Rain Room, an indoor downpour that pauses wherever a visitor walks, exploring instinct, simulation and collective behaviour.", "https://www.random-international.com", "Random International"),
  E("UNIVERSAL EVERYTHING", "culture", 7.5, 6.5, 7.5, 8.5, 7.0, "Sheffield digital art studio founded by Matt Pyke, creating walking figures and responsive crowds shown everywhere from the V&A to giant public screens.", "https://www.universaleverything.com", "Universal Everything"),
  E("MARSHMALLOW LASER FEAST", "culture", 8.0, 6.5, 8.0, 8.0, 7.0, "London experiential art collective using virtual reality and breath-tracking to let audiences experience forests, oceans and the inside of the body.", "https://www.marshmallowlaserfeast.com", "Marshmallow Laser Feast"),
  E("ARS ELECTRONICA", "culture", 8.5, 7.5, 8.5, 7.5, 7.5, "Linz festival, museum and lab founded in 1979 at the meeting point of art, technology and society, whose annual Prix is the most established award in media art.", "https://ars.electronica.art", "Ars Electronica"),
  E("RIJKSMUSEUM", "culture", 8.0, 7.5, 9.0, 7.5, 8.5, "The Netherlands' national museum, which released hundreds of thousands of artworks as free high-resolution downloads through Rijksstudio, setting the standard for open cultural access.", "https://www.rijksmuseum.nl", "Rijksmuseum"),
  E("SOMERSET HOUSE", "culture", 7.5, 7.0, 8.0, 7.5, 8.0, "Neoclassical London landmark turned creative community, home to hundreds of resident artists and makers, Somerset House Studios and a courtyard of fountains, film and ice.", "https://www.somersethouse.org.uk", "Somerset House"),
  E("AARDMAN", "culture", 7.5, 7.0, 8.5, 8.5, 9.0, "Bristol animation studio behind Wallace and Gromit and Shaun the Sheep, which transferred ownership to its employees in 2018 to protect its creative independence.", "https://www.aardman.com", "Aardman Animations"),
  E("CRITERION", "culture", 7.5, 6.5, 8.0, 8.0, 8.5, "New York home video company dedicated to publishing and restoring important classic and contemporary films, treating cinema as an art form worth preserving.", "https://www.criterion.com", "The Criterion Collection"),
  E("PHAIDON", "culture", 7.0, 6.5, 7.5, 7.0, 7.5, "Art and design publisher founded in Vienna in 1923, producing definitive books on artists, architecture and food from offices in London and New York.", "https://www.phaidon.com", "Phaidon Press"),

  /* ---- MUSIC & SOUND ---- */
  E("BRIAN ENO", "music", 9.0, 7.5, 8.5, 8.5, 8.5, "British musician and artist who pioneered ambient music and co-founded EarthPercent, a charity channelling music industry money into climate action. A long-serving trustee of the Long Now Foundation, whose name he coined.", null, "Brian Eno"),
  E("APHEX TWIN", "music", 8.0, 7.0, 7.0, 8.5, 8.5, "Cornish electronic musician Richard D. James, widely regarded as one of the most inventive figures in electronic music, whose work on Warp Records reshaped what the genre could be.", null, "Aphex Twin"),
  E("BJ\u00d6RK", "music", 8.5, 7.5, 8.0, 9.0, 8.5, "Icelandic musician whose work fuses music, technology and the natural world, from the Biophilia app album to campaigns protecting Iceland's highlands from heavy industry.", null, "Bj\u00f6rk"),
  E("HOLLY HERNDON", "music", 8.5, 7.0, 7.5, 7.5, 6.5, "American composer working with AI and the human voice, who trained a digital twin of her own voice, Holly+, and co-created tools for artists to manage their likeness in the AI era.", null, "Holly Herndon"),
  E("IMOGEN HEAP", "music", 8.0, 6.5, 7.5, 7.0, 7.0, "British musician and inventor of the MiMu gloves, gestural instruments that turn movement into sound, and founder of projects exploring fair pay for artists through music data.", null, "Imogen Heap"),
  E("MAX RICHTER", "music", 7.5, 6.5, 8.0, 8.0, 8.5, "German-British composer whose eight-hour work Sleep reimagined how and where music is experienced, and a defining voice of the post-classical movement.", null, "Max Richter"),
  E("WARP RECORDS", "music", 8.0, 7.5, 7.5, 8.5, 8.5, "Independent label born in Sheffield in 1989, home to Aphex Twin, Boards of Canada and Autechre, which defined the sound of electronic listening music.", "https://warp.net", "Warp (record label)"),
  E("HYPERDUB", "music", 8.0, 7.0, 7.5, 8.0, 7.5, "London label founded by Steve Goodman, alias Kode9, in 2004, which grew from dubstep's first wave into one of electronic music's most forward-looking imprints.", "https://hyperdub.net", "Hyperdub"),
  E("NINJA TUNE", "music", 7.5, 7.0, 8.0, 7.5, 8.0, "Independent London label founded by Coldcut in 1990, an early leader on sustainability in music with a solar-powered headquarters and support for the Music Climate Pact.", "https://ninjatune.net", "Ninja Tune"),
  E("ECM", "music", 8.0, 6.5, 8.0, 7.5, 8.0, "Munich label founded by Manfred Eicher in 1969, releasing jazz and contemporary classical music with uncompromising production values, from Keith Jarrett's Koln Concert to Arvo Part.", "https://www.ecmrecords.com", "ECM Records"),
  E("NTS RADIO", "music", 8.0, 7.0, 8.0, 8.5, 8.5, "Independent online radio station founded in Hackney in 2011, broadcasting from London, Manchester, Los Angeles and Shanghai with thousands of resident hosts and no playlists.", "https://www.nts.live", "NTS Radio"),
  E("BANDCAMP", "music", 7.5, 7.5, 8.5, 7.0, 8.0, "Online music platform founded in 2008 where fans buy directly from artists, paying out the large majority of every sale; its Bandcamp Fridays have channelled hundreds of millions of dollars to musicians.", "https://bandcamp.com", "Bandcamp"),

  /* ---- DESIGN ---- */
  E("APPLE", "design", 8.5, 9.0, 7.5, 9.5, 8.0, "American technology company founded in 1976, maker of the iPhone and Mac and the company that defined modern consumer hardware design. Aims for carbon neutrality across all its products by 2030.", "https://www.apple.com", "Apple Inc."),
  E("TEENAGE ENGINEERING", "design", 8.0, 7.0, 8.0, 8.5, 8.5, "Swedish electronics company founded in Stockholm in 2007, designing playful audio hardware such as the OP-1 synthesiser and collaborating with brands from IKEA to Nothing.", "https://teenage.engineering", "Teenage Engineering"),
  E("IKEA", "design", 8.0, 8.5, 8.0, 7.5, 8.0, "Swedish furniture retailer founded by Ingvar Kamprad in 1943, whose flat-pack democratic design made good furniture affordable worldwide. Investing heavily in circular and renewable operations.", "https://www.ikea.com", "IKEA"),
  E("ABLETON", "music", 7.5, 7.0, 8.0, 7.0, 8.5, "Berlin music software company founded in 1999 by musicians, maker of Ableton Live, a digital audio workstation built for performance as much as production, and the Push instrument.", "https://www.ableton.com", "Ableton"),
  E("IDEO", "design", 7.5, 7.5, 8.0, 8.5, 7.5, "Global design consultancy formed in Palo Alto in 1991, which popularised design thinking and human-centred design across products, services and organisations.", "https://www.ideo.com", "IDEO"),
  E("MUJI", "design", 7.5, 7.0, 8.0, 7.0, 8.0, "Japanese retailer founded in 1980 around the idea of no-brand quality goods, selling simple, functional products with an ethos of sufficiency and restraint.", "https://www.muji.com", "Muji"),
  E("PENTAGRAM", "design", 7.0, 7.0, 7.5, 7.5, 8.0, "The world's largest independent design consultancy, founded in London in 1972 and owned entirely by its partners, who each lead their own creative teams.", "https://www.pentagram.com", "Pentagram (design firm)"),
  E("NOTHING", "design", 7.0, 7.0, 6.5, 8.0, 7.0, "London consumer technology company founded by Carl Pei in 2020, building smartphones and earbuds with a distinctive transparent design language.", "https://nothing.tech", "Nothing (company)"),

  E("SN\u00d8HETTA", "design", 8.5, 8.0, 8.5, 8.0, 8.0, "Norwegian architecture studio behind the Oslo Opera House and the Powerhouse series of energy-positive buildings, which produce more energy than they consume over their lifetime.", "https://www.snohetta.com", "Sn\u00f8hetta"),
  E("BIG", "design", 8.5, 8.0, 7.5, 8.5, 7.0, "Copenhagen and New York architecture practice founded by Bjarke Ingels, whose CopenHill power plant doubles as a ski slope and whose Masterplanet project sketches a sustainable redesign of Earth.", "https://big.dk", "Bjarke Ingels Group"),
  E("HEATHERWICK STUDIO", "design", 8.0, 7.5, 7.5, 8.5, 7.5, "London design studio founded by Thomas Heatherwick, maker of the Seed Cathedral, Little Island in New York and a public campaign against boring buildings.", "https://www.heatherwick.com", "Heatherwick Studio"),
  E("ZAHA HADID ARCHITECTS", "design", 8.0, 8.0, 7.0, 8.0, 7.5, "Global architecture practice continuing the work of Zaha Hadid, advancing parametric design and algorithmically optimised structures across four continents.", "https://www.zaha-hadid.com", "Zaha Hadid Architects"),
  E("FOSTER + PARTNERS", "design", 8.0, 8.5, 7.5, 7.5, 7.5, "British architecture and engineering practice founded by Norman Foster, designer of sustainable landmarks from the Reichstag dome to Apple Park, and of 3D-printed lunar habitats with ESA.", "https://www.fosterandpartners.com", "Foster and Partners"),
  E("NERI OXMAN", "design", 8.5, 7.5, 7.5, 8.0, 6.5, "American-Israeli designer and former MIT professor whose material ecology work grows structures from silkworms, melanin and biopolymers, now continued at her New York studio OXMAN.", "https://oxman.com", "Neri Oxman"),
  E("IRIS VAN HERPEN", "design", 8.0, 6.5, 7.0, 8.5, 7.5, "Dutch couturier who brought 3D printing to the Paris runway, creating garments grown from algae, recycled ocean plastic and parametric patterns.", "https://www.irisvanherpen.com", "Iris van Herpen"),
  E("SUPERFLUX", "design", 8.5, 6.5, 8.0, 7.5, 6.5, "London speculative design studio founded by Anab Jain and Jon Ardern, building immersive futures, from flooded living rooms to AI companions, that help institutions feel what is coming.", "https://superflux.in", "Superflux"),
  E("VITRA", "design", 7.5, 7.0, 8.0, 7.5, 8.0, "Swiss family-owned furniture company producing the works of Eames, Panton and Prouve, whose Weil am Rhein campus and Design Museum made it a pilgrimage site for design.", "https://www.vitra.com", "Vitra (furniture)"),
  E("DEZEEN", "design", 7.0, 6.5, 7.5, 7.5, 7.5, "The world's most read architecture and design publication, founded in London in 2006, whose awards and manifesto projects platform ideas for a better built future.", "https://www.dezeen.com", "Dezeen"),
  E("BLENDER", "design", 8.0, 8.0, 9.0, 7.0, 8.5, "Free and open-source 3D creation suite maintained by the Amsterdam-based Blender Foundation, now used on Oscar-winning films and by millions of artists who could never afford commercial tools.", "https://www.blender.org", "Blender (software)"),

  /* ---- DEEP TECH ---- */
  E("BOSTON DYNAMICS", "deeptech", 8.0, 8.5, 7.0, 8.5, 7.5, "American robotics company spun out of MIT in 1992, creator of the Atlas humanoid and Spot quadruped robots, and now owned by Hyundai Motor Group.", "https://bostondynamics.com", "Boston Dynamics"),
  E("FRAMEWORK", "deeptech", 8.0, 7.5, 9.0, 7.5, 8.0, "San Francisco company founded in 2019, making modular laptops designed to be repaired and upgraded by their owners, a working proof of the right-to-repair movement.", "https://frame.work", "Framework Computer"),
  E("CEREBRAS", "deeptech", 8.0, 8.5, 7.5, 6.0, 6.5, "Californian AI hardware company founded in 2016, maker of the Wafer-Scale Engine, the largest computer chip ever built, used for training and running AI models.", "https://www.cerebras.ai", "Cerebras"),
  E("IONQ", "deeptech", 8.0, 8.5, 8.0, 6.0, 6.5, "American quantum computing company founded in 2015 from University of Maryland and Duke research, building trapped-ion quantum computers accessible through the major cloud platforms.", "https://ionq.com", "IonQ"),
  E("FAIRPHONE", "deeptech", 8.0, 7.0, 9.0, 7.0, 7.5, "Dutch social enterprise founded in 2013, making modular, repairable smartphones with fairly sourced materials and transparent supply chains.", "https://www.fairphone.com", "Fairphone"),
  E("DYSON", "deeptech", 7.5, 7.5, 7.5, 7.0, 7.5, "British technology company founded by James Dyson in 1991, known for cyclonic vacuum cleaners, bladeless fans and an engineering-led product culture. Headquartered in Singapore.", "https://www.dyson.com", "Dyson (company)"),

  E("SIGNAL", "deeptech", 8.5, 8.0, 9.0, 6.5, 7.5, "Non-profit foundation behind the Signal messenger, whose end-to-end encryption protocol also secures billions of conversations in other apps, run without advertising or data harvesting.", "https://signal.org", "Signal (software)"),

  /* ---- EDUCATION ---- */
  E("WIKIPEDIA", "education", 9.0, 9.0, 10, 5.5, 9.0, "The free encyclopaedia, launched in 2001 and written collaboratively by volunteers, now spanning tens of millions of articles in more than 300 languages. Operated by the non-profit Wikimedia Foundation.", "https://www.wikipedia.org", "Wikipedia"),
  E("KHAN ACADEMY", "education", 9.0, 8.5, 9.5, 7.5, 9.0, "Non-profit founded by Sal Khan in 2008, providing free online lessons and practice in maths, science and the humanities to learners worldwide, now including the AI tutor Khanmigo.", "https://www.khanacademy.org", "Khan Academy"),
  E("OUR WORLD IN DATA", "education", 9.0, 8.0, 9.5, 8.0, 8.5, "Oxford-based research publication founded by Max Roser, presenting open data and analysis on global problems from poverty to climate change. Used by media, schools and policymakers worldwide.", "https://ourworldindata.org", "Our World in Data"),
  E("RASPBERRY PI", "education", 8.0, 7.5, 9.0, 7.0, 8.5, "Cambridge-based charity founded in 2008 to put affordable computing into young people's hands. Its tiny single-board computers have sold in the tens of millions worldwide.", "https://www.raspberrypi.org", "Raspberry Pi Foundation"),
  E("BRILLIANT", "education", 7.5, 7.5, 8.5, 7.0, 7.0, "San Francisco education company founded in 2012, teaching maths, science, programming and reasoning through interactive problem solving rather than lectures.", "https://brilliant.org", "Brilliant.org"),

  E("ARDUINO", "education", 8.0, 7.5, 9.0, 7.0, 8.5, "Open-source electronics platform born at the Ivrea Interaction Design Institute in 2005, which put physical computing into the hands of millions of students, artists and inventors.", "https://www.arduino.cc", "Arduino"),
  E("PROCESSING FOUNDATION", "education", 8.0, 7.0, 9.0, 6.5, 7.5, "Non-profit behind Processing and p5.js, the free creative coding tools that taught a generation of artists and designers to program.", "https://processingfoundation.org", "Processing (programming language)"),
  E("MIT PRESS", "education", 7.5, 7.0, 8.5, 6.5, 7.5, "University press founded in 1962, publishing landmark works across science, technology, art and design, and an early mover in open access publishing.", "https://mitpress.mit.edu", "MIT Press"),
  E("EDEN PROJECT", "education", 8.0, 7.0, 8.5, 8.0, 8.5, "Cornish educational charity built in a former clay pit, whose giant biomes house the world's largest indoor rainforest and teach regeneration at scale.", "https://www.edenproject.com", "Eden Project"),
  E("EXPLORATORIUM", "education", 8.0, 7.0, 8.5, 7.0, 8.0, "San Francisco's museum of science, art and human perception, founded by physicist Frank Oppenheimer in 1969, whose hands-on exhibits set the template for science museums worldwide.", "https://www.exploratorium.edu", "Exploratorium"),

  /* ---- COMMERCE & IMPACT ---- */
  E("BREAKTHROUGH ENERGY", "finance", 8.5, 9.0, 9.0, 7.0, 7.5, "Network founded by Bill Gates in 2015, investing patient capital in early-stage climate technologies, from fusion and long-duration batteries to green steel and sustainable aviation fuel.", "https://www.breakthroughenergy.org", "Breakthrough Energy"),
  E("WELLCOME TRUST", "finance", 8.5, 8.5, 9.0, 6.5, 7.5, "London charitable foundation established in 1936 from the estate of Henry Wellcome, and one of the world's largest funders of health research, with a multi-billion pound endowment.", "https://wellcome.org", "Wellcome Trust"),

];

/* ---------- scoring ---------- */
const score = (e) => DIMENSIONS.reduce((t, d) => t + e[d.key] * d.weight, 0);
const tierOf = (s) => TIERS.find((t) => s >= t.min) || TIERS[TIERS.length - 1];
const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);
const mod = (n, m) => ((n % m) + m) % m;

const RANKED_ALL = ENTRIES.map((e) => ({ ...e, score: score(e) })).sort((a, b) => b.score - a.score);

const linkFor = (e) => e.url || `https://en.wikipedia.org/wiki/${encodeURIComponent(e.wiki.replace(/ /g, "_"))}`;
const isWikiLink = (e) => !e.url;

/* ---------- image hook: Cloudinary or sigil ---------- */
const IMG_RESOLVED = new Map(); // id -> resolved src, or null when all candidates failed

function useEntryImage(entry) {
  const id = entry.img || slug(entry.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const candidates = useMemo(() => imgCandidates(entry), [id]);
  const [step, setStep] = useState(() => {
    const r = IMG_RESOLVED.get(id);
    if (r === null) return candidates.length; // known dead, go straight to sigil
    if (r) return candidates.indexOf(r) >= 0 ? candidates.indexOf(r) : 0;
    return 0;
  });

  useEffect(() => {
    const r = IMG_RESOLVED.get(id);
    if (r === null) setStep(candidates.length);
    else if (r && candidates.indexOf(r) >= 0) setStep(candidates.indexOf(r));
    else setStep(0);
  }, [id, candidates]);

  const onError = useCallback(() => {
    setStep((s) => {
      const next = s + 1;
      if (next >= candidates.length) IMG_RESOLVED.set(id, null);
      return next;
    });
  }, [id, candidates]);

  const onLoad = useCallback(() => {
    setStep((s) => {
      if (s < candidates.length) IMG_RESOLVED.set(id, candidates[s]);
      return s;
    });
  }, [id, candidates]);

  return { src: step < candidates.length ? candidates[step] : null, onError, onLoad };
}

/* ---------- sigil: orbital glyph drawn from the five scores ---------- */
const polar = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const arcPath = (cx, cy, r, a0, a1) => {
  const [sx, sy] = polar(cx, cy, r, a1);
  const [ex, ey] = polar(cx, cy, r, a0);
  const large = a1 - a0 <= 180 ? 0 : 1;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
};

const Sigil = memo(function Sigil({ entry, size = 88, animate = false, needleColor }) {
  const radii = [16, 22, 28, 34, 40];
  const start = -150;
  const needleA = start + (entry.score / 10) * 300;
  const [nx, ny] = polar(50, 50, 44, needleA);
  const tip = polar(50, 50, 47, needleA);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className={animate ? "pf-sigil pf-sigil-anim" : "pf-sigil"}>
      {DIMENSIONS.map((d, idx) => {
        const sweep = Math.max(4, (entry[d.key] / 10) * 300);
        return (
          <path
            key={d.key}
            className="pf-ring"
            d={arcPath(50, 50, radii[idx], start, start + sweep)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="butt"
            opacity={0.32 + idx * 0.16}
            pathLength="1"
            style={animate ? { animationDelay: `${idx * 90}ms` } : undefined}
          />
        );
      })}
      <line x1="50" y1="50" x2={nx} y2={ny} stroke={needleColor || "currentColor"} strokeWidth="2" className="pf-needle" />
      <circle cx={tip[0]} cy={tip[1]} r="2.6" fill={needleColor || "currentColor"} />
      <circle cx="50" cy="50" r="2.6" fill={needleColor || "currentColor"} />
    </svg>
  );
});

/* ---------- count-up ---------- */
function useCountUp(target, ms = 700) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      setVal(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

/* ---------- tile ---------- */
const Tile = memo(function Tile({ entry, w, h, onOpen }) {
  const tier = tierOf(entry.score);
  const isPF = tier.name === "PATHFINDER";
  const sector = SECTORS.find((s) => s.id === entry.sector);
  const { src, onError, onLoad } = useEntryImage(entry);
  return (
    <button
      className={`pf-tile ${isPF ? "pf-tile-path" : ""} ${src ? "" : "pf-tile-sigilmode"}`}
      style={{ width: w, height: h }}
      data-pfname={entry.name}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(entry); }
      }}
      aria-label={`${entry.name}, ${fmt(entry.score)}, ${tier.name}`}
    >
      <span className="pf-tile-top">
        <span className="pf-tile-sector">
          <i className={`pf-dot pf-dot-${tier.name.toLowerCase()}`} />
          {sector ? sector.label : ""}
        </span>
        <span className="pf-tile-score">{fmt(entry.score)}</span>
      </span>
      <span className="pf-photo">
        {src ? (
          <img
            className="pf-img"
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable="false"
            onLoad={onLoad}
            onError={onError}
          />
        ) : (
          <Sigil entry={entry} size={Math.round(w * 0.46)} needleColor={isPF ? SIGNAL : undefined} />
        )}
      </span>
      <span className="pf-tile-name">{entry.name}</span>
    </button>
  );
});

/* ---------- infinite field ---------- */
function InfiniteField({ list, cell, onOpen, reduced }) {
  const { w, h, gap } = cell;
  const CW = w + gap;
  const CH = h + gap;
  const camRef = useRef({ x: -14, y: -84 });
  const velRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(0);
  const idleRef = useRef(performance.now() - 4000);
  const innerRef = useRef(null);
  const fieldRef = useRef(null);
  const cleanupRef = useRef(null);
  const downTimeRef = useRef(0);
  const originRef = useRef({ c: -2, r: -2 });
  const [origin, setOrigin] = useState({ c: -2, r: -2 });
  const [vp, setVp] = useState({ vw: 0, vh: 0 });

  const byName = useMemo(() => {
    const m = new Map();
    list.forEach((e) => m.set(e.name, e));
    return m;
  }, [list]);

  /* Measure the field element itself. Inside iframes and publish wrappers,
     window.innerWidth can read 0 at mount, which previously produced
     degenerate cell maths and a re-render storm that froze the page. */
  useEffect(() => {
    const el = fieldRef.current;
    const measure = () => {
      const w2 = el ? el.clientWidth : window.innerWidth;
      const h2 = el ? el.clientHeight : window.innerHeight;
      setVp((p) => (p.vw === w2 && p.vh === h2 ? p : { vw: w2, vh: h2 }));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    let ro = null;
    if (typeof ResizeObserver !== "undefined" && el) {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      const cam = camRef.current;
      if (!dragRef.current) {
        cam.x += velRef.current.x;
        cam.y += velRef.current.y;
        velRef.current.x *= 0.93;
        velRef.current.y *= 0.93;
        if (Math.abs(velRef.current.x) < 0.02) velRef.current.x = 0;
        if (Math.abs(velRef.current.y) < 0.02) velRef.current.y = 0;
        if (!reduced) {
          const idleFor = performance.now() - idleRef.current;
          if (idleFor > 2400) {
            const ramp = Math.min(1, (idleFor - 2400) / 2000);
            cam.x += 0.11 * ramp;
            cam.y += 0.17 * ramp;
          }
        }
      }
      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${-cam.x}px, ${-cam.y}px, 0)`;
      }
      if (CW > 0 && CH > 0) {
        const nc = Math.floor(cam.x / CW) - 1;
        const nr = Math.floor(cam.y / CH) - 1;
        if (Number.isFinite(nc) && Number.isFinite(nr) && (nc !== originRef.current.c || nr !== originRef.current.r)) {
          originRef.current = { c: nc, r: nr };
          setOrigin({ c: nc, r: nr });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [CW, CH, reduced]);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      camRef.current.x += e.deltaX;
      camRef.current.y += e.deltaY;
      velRef.current = { x: 0, y: 0 };
      idleRef.current = performance.now();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  /* Drag handling uses window listeners with no pointer capture. Taps are
     detected on pointerup via elementFromPoint, so opening a card does not
     depend on the host's click dispatch at all. */
  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = true;
    movedRef.current = 0;
    downTimeRef.current = performance.now();
    lastRef.current = { x: e.clientX, y: e.clientY };
    velRef.current = { x: 0, y: 0 };
    idleRef.current = performance.now();

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - lastRef.current.x;
      const dy = ev.clientY - lastRef.current.y;
      camRef.current.x -= dx;
      camRef.current.y -= dy;
      velRef.current = { x: -dx * 0.85, y: -dy * 0.85 };
      movedRef.current += Math.abs(dx) + Math.abs(dy);
      lastRef.current = { x: ev.clientX, y: ev.clientY };
      idleRef.current = performance.now();
    };
    const onUp = (ev) => {
      dragRef.current = false;
      idleRef.current = performance.now();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      cleanupRef.current = null;
      const dt = performance.now() - downTimeRef.current;
      if (ev && ev.type === "pointerup" && movedRef.current < 9 && dt < 600) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const hit = el && el.closest ? el.closest("[data-pfname]") : null;
        if (hit) {
          const entry = byName.get(hit.getAttribute("data-pfname"));
          if (entry) onOpen(entry);
        }
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    cleanupRef.current = onUp;
  };

  const N = list.length;
  const rowShift = useMemo(() => {
    if (N === 0) return 1;
    return [7, 11, 13, 17, 19, 5, 3].find((k) => N % k !== 0) || 1;
  }, [N]);

  const cols = CW > 0 ? Math.ceil(vp.vw / CW) + 2 : 0;
  const rows = CH > 0 ? Math.ceil(vp.vh / CH) + 2 : 0;

  const cells = [];
  if (N > 0 && vp.vw > 0 && cols > 0 && rows > 0) {
    for (let r = origin.r; r < origin.r + rows; r++) {
      for (let c = origin.c; c < origin.c + cols; c++) {
        const entry = list[mod(c + r * rowShift, N)];
        cells.push(
          <div key={`${c}:${r}`} className="pf-cell" style={{ left: c * CW, top: r * CH }}>
            <Tile entry={entry} w={w} h={h} onOpen={onOpen} />
          </div>
        );
      }
    }
  }

  return (
    <div ref={fieldRef} className="pf-field" onPointerDown={onDown}>
      <div ref={innerRef} className="pf-field-inner">
        {cells}
      </div>
      {N === 0 && <div className="pf-empty">NO ENTRIES ON THIS BEARING</div>}
    </div>
  );
}

/* ---------- info card ---------- */
function InfoCard({ ranked, idx, onClose, onStep }) {
  const entry = ranked[idx];
  const tier = tierOf(entry.score);
  const isPF = tier.name === "PATHFINDER";
  const sector = SECTORS.find((s) => s.id === entry.sector);
  const animated = useCountUp(entry.score, 750);
  const { src, onError, onLoad } = useEntryImage(entry);
  const [barsOn, setBarsOn] = useState(false);

  useEffect(() => {
    setBarsOn(false);
    const t = setTimeout(() => setBarsOn(true), 60);
    return () => clearTimeout(t);
  }, [idx]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  const href = linkFor(entry);
  const wikiLink = isWikiLink(entry);

  return (
    <div className="pf-card-backdrop" onClick={onClose}>
      <div
        className="pf-card"
        role="dialog"
        aria-modal="true"
        aria-label={entry.name}
        onClick={(e) => e.stopPropagation()}
        key={entry.name}
      >
        <div className="pf-card-media">
          {src ? (
            <>
              <img
                className="pf-card-img"
                src={src}
                alt={entry.name}
                onLoad={onLoad}
                onError={onError}
                draggable="false"
              />
              <span className="pf-card-mediascrim" />
            </>
          ) : (
            <div className="pf-card-sigilbox">
              <Sigil entry={entry} size={120} animate needleColor={isPF ? SIGNAL : "#FFFFFF"} />
            </div>
          )}
          <button className="pf-x pf-card-x" onClick={onClose} aria-label="Close">×</button>
          <span className="pf-card-counter pf-mono">{String(idx + 1).padStart(2, "0")} / {ranked.length}</span>
        </div>

        <div className="pf-card-body">
          <div className="pf-detail-meta">
            <span className="pf-mono">{sector ? sector.label : ""}</span>
            <span className={`pf-tiertag ${isPF ? "pf-tiertag-path" : ""}`}>
              <i className={`pf-dot pf-dot-${tier.name.toLowerCase()}`} />
              {tier.name}
            </span>
          </div>
          <h2 className="pf-card-name">{entry.name}</h2>

          <div className="pf-card-scorerow">
            <div>
              <div className="pf-mono pf-dim">PATHFINDER SCORE</div>
              <div className={`pf-card-score ${isPF ? "pf-blue" : ""}`}>{fmt(animated)}</div>
            </div>
            {src && (
              <div className="pf-card-minisigil">
                <Sigil entry={entry} size={92} animate needleColor={isPF ? SIGNAL : "#FFFFFF"} />
              </div>
            )}
          </div>

          <div className="pf-bars">
            {DIMENSIONS.map((d, i) => (
              <div className="pf-bar-row" key={d.key}>
                <span className="pf-bar-label">{d.label}</span>
                <span className="pf-bar-track">
                  <span
                    className="pf-bar-fill"
                    style={{
                      transform: barsOn ? `scaleX(${entry[d.key] / 10})` : "scaleX(0)",
                      transitionDelay: `${120 + i * 90}ms`,
                    }}
                  />
                </span>
                <span className="pf-bar-val">{fmt(entry[d.key])}</span>
              </div>
            ))}
          </div>

          <p className="pf-card-note">{entry.desc}</p>

          <a className="pf-link" href={href} target="_blank" rel="noopener noreferrer">
            {wikiLink ? "READ ON WIKIPEDIA" : "VISIT SITE"} <span aria-hidden="true">↗</span>
          </a>

          <div className="pf-detail-nav">
            <button className="pf-navbtn" onClick={() => onStep(-1)}>← PREV</button>
            <button className="pf-navbtn" onClick={() => onStep(1)}>NEXT →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- method overlay ---------- */
function Method({ onClose, total }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pf-overlay" role="dialog" aria-modal="true" aria-label="About the index">
      <div className="pf-overlay-bar">
        <span className="pf-mono">THE METHOD</span>
        <button className="pf-x" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="pf-detail-scroll pf-method">
        <h2 className="pf-method-title">A LIVING SURVEY OF THOSE BUILDING THE FUTURE</h2>
        <p className="pf-body">
          The Pathfinder Index is Deep Time's living survey of the organisations, brands and places doing the most to
          push humanity forward through art, science and culture. It exists to celebrate the pioneers, to spotlight the
          clarity of their vision and to dramatise the distance between those who talk about the future and those who
          are building it.
        </p>
        <p className="pf-body">
          Every entry is graded across five dimensions, weighted into a single composite score out of ten. The score
          places each of the {total} entries into one of four tiers, and the index is rebalanced as the world moves.
        </p>

        <div className="pf-method-grid">
          {DIMENSIONS.map((d) => (
            <div className="pf-method-row" key={d.key}>
              <span className="pf-method-dim">{d.label}</span>
              <span className="pf-method-w">{Math.round(d.weight * 100)}%</span>
              <span className="pf-method-desc">{d.desc}</span>
            </div>
          ))}
        </div>

        <div className="pf-method-grid">
          {TIERS.map((t) => (
            <div className="pf-method-row" key={t.name}>
              <span className="pf-method-dim">
                <i className={`pf-dot pf-dot-${t.name.toLowerCase()}`} /> {t.name}
              </span>
              <span className="pf-method-w">{t.min > 0 ? `${t.min.toFixed(1)}+` : `< 5.5`}</span>
              <span className="pf-method-desc">{t.desc}</span>
            </div>
          ))}
        </div>

        <p className="pf-body pf-dim-note">
          Descriptions are drawn from each entry's public record. Imagery is curated by Deep Time; entries awaiting an
          image show their sigil, a glyph drawn from their five scores.
        </p>

        <p className="pf-mission">
          ART EXPANDS MEANING. SCIENCE EXPANDS REALITY. CULTURE IS HOW WE SHARE IDEAS.
        </p>
        <p className="pf-mono pf-dim">© DEEP TIME · OUR MISSION IS TO PROMOTE HUMAN PROGRESS THROUGH ART, SCIENCE AND CULTURE</p>
      </div>
    </div>
  );
}

/* ---------- ranked ledger ---------- */
function Ledger({ ranked, query, setQuery, onOpen }) {
  return (
    <div className="pf-ledger">
      <div className="pf-ledger-head">
        <input
          className="pf-search"
          value={query}
          placeholder="SEARCH THE INDEX"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the index"
        />
      </div>
      {ranked.map((e, i) => {
        const t = tierOf(e.score);
        const isPF = t.name === "PATHFINDER";
        const sector = SECTORS.find((s) => s.id === e.sector);
        return (
          <button key={e.name} className="pf-row" onClick={() => onOpen(i)}>
            <span className="pf-row-rank">{String(i + 1).padStart(2, "0")}</span>
            <span className="pf-row-main">
              <span className="pf-row-name">{e.name}</span>
              <span className="pf-row-sector">{sector ? sector.label : ""}</span>
            </span>
            <span className={`pf-row-score ${isPF ? "pf-blue" : ""}`}>
              {fmt(e.score)} <i className={`pf-dot pf-dot-${t.name.toLowerCase()}`} />
            </span>
          </button>
        );
      })}
      {ranked.length === 0 && (
        <div className="pf-empty pf-empty-ledger">NO ENTRIES ON THIS BEARING. CLEAR THE SEARCH TO SEE THE FULL INDEX.</div>
      )}
    </div>
  );
}

/* ============================================================ */
export default function PathfinderIndex() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [view, setView] = useState("field"); // field | index
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null); // index into ranked
  const [method, setMethod] = useState(false);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 390);

  useEffect(() => {
    const onR = () => setVw(window.innerWidth);
    const raf = requestAnimationFrame(onR);
    window.addEventListener("resize", onR);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onR);
    };
  }, []);

  const cell = useMemo(() => {
    if (vw > 0 && vw < 520) {
      const w = Math.max(150, Math.floor((vw - 28) / 2));
      return { w, h: Math.round(w * 1.26), gap: 8 };
    }
    if (vw < 900) return { w: 190, h: 240, gap: 10 };
    if (vw < 1500) return { w: 222, h: 278, gap: 12 };
    if (vw < 2100) return { w: 270, h: 338, gap: 14 };
    return { w: 340, h: 425, gap: 16 };
  }, [vw]);

  const ranked = useMemo(() => {
    let list = RANKED_ALL;
    if (filter !== "all") list = list.filter((e) => e.sector === filter);
    if (view === "index" && query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q));
    }
    return list;
  }, [filter, query, view]);

  const fieldList = useMemo(() => {
    let list = RANKED_ALL;
    if (filter !== "all") list = list.filter((e) => e.sector === filter);
    return list;
  }, [filter]);

  const openEntry = useCallback(
    (entry) => {
      const i = ranked.findIndex((e) => e.name === entry.name);
      setSelected(i >= 0 ? i : 0);
    },
    [ranked]
  );

  const step = useCallback(
    (d) => setSelected((s) => (s === null ? s : mod(s + d, ranked.length))),
    [ranked.length]
  );

  const counts = useMemo(() => {
    const m = { all: RANKED_ALL.length };
    SECTORS.forEach((s) => (m[s.id] = RANKED_ALL.filter((e) => e.sector === s.id).length));
    return m;
  }, []);

  return (
    <div className="pf-root">
      <style>{CSS}</style>

      {view === "field" ? (
        <InfiniteField list={fieldList} cell={cell} onOpen={openEntry} reduced={reduced} />
      ) : (
        <Ledger ranked={ranked} query={query} setQuery={setQuery} onOpen={(i) => setSelected(i)} />
      )}

      {/* HUD top */}
      <header className="pf-hud-top">
        <div className="pf-wordmark">
          <span className="pf-wm-line">THE PATHFINDER</span>
          <span className="pf-wm-line">INDEX<span className="pf-blue">.</span></span>
          <span className="pf-wm-sub">BY DEEP TIME</span>
        </div>
        <div className="pf-hud-controls">
          <span className="pf-mono pf-count">{fieldList.length} ENTRIES</span>
          <div className="pf-toggle" role="tablist" aria-label="View">
            <button className={`pf-toggle-btn ${view === "field" ? "on" : ""}`} onClick={() => setView("field")} role="tab" aria-selected={view === "field"}>FIELD</button>
            <button className={`pf-toggle-btn ${view === "index" ? "on" : ""}`} onClick={() => setView("index")} role="tab" aria-selected={view === "index"}>INDEX</button>
          </div>
          <button className="pf-method-btn" onClick={() => setMethod(true)}>METHOD</button>
        </div>
      </header>

      {/* HUD bottom */}
      <footer className="pf-hud-bottom">
        <div className="pf-filters">
          <button className={`pf-pill ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>
            ALL <span className="pf-pill-n">{counts.all}</span>
          </button>
          {SECTORS.map((s) => (
            <button key={s.id} className={`pf-pill ${filter === s.id ? "on" : ""}`} onClick={() => setFilter(s.id)}>
              {s.label} <span className="pf-pill-n">{counts[s.id]}</span>
            </button>
          ))}
        </div>
        <div className="pf-ticker" aria-hidden="true">
          <div className="pf-ticker-track">
            {[0, 1].map((k) => (
              <span key={k} className="pf-ticker-seg">
                ART EXPANDS MEANING&nbsp;&nbsp;·&nbsp;&nbsp;SCIENCE EXPANDS REALITY&nbsp;&nbsp;·&nbsp;&nbsp;CULTURE IS HOW WE
                SHARE IDEAS&nbsp;&nbsp;·&nbsp;&nbsp;A LONG-TERM VISION FOR HUMAN PROGRESS&nbsp;&nbsp;·&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
      </footer>

      {selected !== null && ranked[selected] && (
        <InfoCard ranked={ranked} idx={selected} onClose={() => setSelected(null)} onStep={step} />
      )}
      {method && <Method onClose={() => setMethod(false)} total={RANKED_ALL.length} />}
    </div>
  );
}

/* ============================================================ CSS */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Space+Grotesk:wght@300;400;500;700&display=swap');

.pf-root, .pf-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.pf-root {
  --ikb: ${IKB};
  --signal: ${SIGNAL};
  position: fixed; inset: 0;
  background: #000; color: #fff;
  font-family: 'ABC Favorit', 'Favorit', 'Space Grotesk', system-ui, sans-serif;
  overflow: hidden;
  user-select: none; -webkit-user-select: none;
}
.pf-root ::selection { background: var(--ikb); color: #fff; }

/* type */
.pf-mono { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.55); }
.pf-dim { color: rgba(255,255,255,0.4); }
.pf-blue { color: var(--signal); }

/* ---------- field ---------- */
.pf-field { position: absolute; inset: 0; touch-action: none; cursor: grab; overflow: hidden; }
.pf-field:active { cursor: grabbing; }
.pf-field-inner { position: absolute; left: 0; top: 0; will-change: transform; }
.pf-cell { position: absolute; }

.pf-tile {
  position: relative; contain: content;
  display: flex; flex-direction: column; justify-content: space-between;
  background: #000; border: 1px solid rgba(255,255,255,0.16);
  color: #fff; padding: 10px 10px 12px; text-align: left;
  cursor: pointer; transition: background 160ms ease, border-color 160ms ease;
  font-family: inherit; overflow: hidden;
}
.pf-tile:focus-visible { outline: 2px solid var(--signal); outline-offset: 2px; }

/* Full-colour imagery inset on black, phantom-style. */
.pf-photo {
  position: relative; flex: 1; margin: 8px 0 9px;
  background: #0B0B0B; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.pf-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 260ms ease; }

@media (hover:hover) {
  .pf-tile:hover { border-color: rgba(255,255,255,0.6); }
  .pf-tile:hover .pf-img { transform: scale(1.045); }
  .pf-tile-sigilmode:hover { background: var(--ikb); border-color: var(--ikb); }
  .pf-tile-sigilmode:hover .pf-tile-sector { color: #fff; }
  .pf-tile-sigilmode:hover .pf-dot { background: #fff !important; border-color: #fff !important; }
  .pf-tile-sigilmode:hover .pf-needle, .pf-tile-sigilmode:hover circle { stroke: #fff; fill: #fff; }
  .pf-tile-sigilmode:hover .pf-photo { background: transparent; }
}
.pf-tile-sigilmode:active { background: var(--ikb); border-color: var(--ikb); }
.pf-tile-sigilmode:active .pf-photo { background: transparent; }

.pf-tile-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
.pf-tile-sector {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 7.5px; letter-spacing: 0.16em; color: rgba(255,255,255,0.55);
  text-transform: uppercase; line-height: 1.1; padding-top: 2px;
}
.pf-tile-score {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; font-size: 13px; line-height: 1;
}
.pf-tile-path .pf-tile-score { color: var(--signal); }
.pf-tile-name {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase;
  font-size: 11.5px; line-height: 1.06; letter-spacing: 0.01em;
  overflow-wrap: break-word;
}

.pf-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex: none; }
.pf-dot-pathfinder { background: var(--signal); }
.pf-dot-navigator { background: #fff; }
.pf-dot-explorer { background: transparent; border: 1px solid rgba(255,255,255,0.7); }
.pf-dot-passenger { background: rgba(255,255,255,0.18); }

.pf-empty {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 10px; letter-spacing: 0.2em; color: rgba(255,255,255,0.4);
}

/* ---------- HUD ---------- */
.pf-hud-top {
  position: absolute; top: 0; left: 0; right: 0; z-index: 20;
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 14px 16px 28px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.94) 30%, rgba(0,0,0,0));
  pointer-events: none;
}
.pf-hud-top > * { pointer-events: auto; }
.pf-wordmark { display: flex; flex-direction: column; }
.pf-wm-line {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase;
  font-size: 15px; line-height: 1.02; letter-spacing: 0.01em;
}
.pf-wm-sub { margin-top: 5px; font-size: 8px; letter-spacing: 0.28em; color: rgba(255,255,255,0.5); }
.pf-hud-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.pf-count { font-size: 9px; }
.pf-toggle { display: flex; border: 1px solid rgba(255,255,255,0.25); }
.pf-toggle-btn {
  background: transparent; color: rgba(255,255,255,0.55); border: none; cursor: pointer;
  font-family: inherit; font-size: 9px; letter-spacing: 0.18em; padding: 6px 10px; text-transform: uppercase;
}
.pf-toggle-btn.on { background: var(--ikb); color: #fff; }
.pf-toggle-btn:focus-visible, .pf-method-btn:focus-visible, .pf-pill:focus-visible,
.pf-row:focus-visible, .pf-x:focus-visible, .pf-navbtn:focus-visible, .pf-link:focus-visible { outline: 2px solid var(--signal); outline-offset: 1px; }
.pf-method-btn {
  background: transparent; border: none; color: rgba(255,255,255,0.55); cursor: pointer;
  font-family: inherit; font-size: 9px; letter-spacing: 0.22em; padding: 0 0 2px; text-transform: uppercase;
  border-bottom: 1px solid rgba(255,255,255,0.3);
}
.pf-method-btn:hover { color: #fff; border-color: #fff; }

.pf-hud-bottom { position: absolute; bottom: 0; left: 0; right: 0; z-index: 20; }
.pf-filters {
  display: flex; gap: 6px; overflow-x: auto; padding: 10px 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.96) 60%, rgba(0,0,0,0));
  scrollbar-width: none;
}
.pf-filters::-webkit-scrollbar { display: none; }
.pf-pill {
  flex: none; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.25);
  color: rgba(255,255,255,0.6); cursor: pointer; font-family: inherit;
  font-size: 8.5px; letter-spacing: 0.16em; padding: 7px 11px; text-transform: uppercase;
  transition: all 140ms ease; display: inline-flex; gap: 6px; align-items: center;
}
.pf-pill .pf-pill-n { color: rgba(255,255,255,0.35); }
.pf-pill.on { background: #fff; border-color: #fff; color: #000; }
.pf-pill.on .pf-pill-n { color: rgba(0,0,0,0.5); }
@media (hover:hover) { .pf-pill:not(.on):hover { border-color: #fff; color: #fff; } }

.pf-ticker { background: var(--ikb); overflow: hidden; height: 26px; display: flex; align-items: center; }
.pf-ticker-track { display: inline-flex; white-space: nowrap; animation: pf-tick 30s linear infinite; }
.pf-ticker-seg {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase;
  font-size: 9px; letter-spacing: 0.12em; color: #000; padding-right: 8px;
}
@keyframes pf-tick { to { transform: translateX(-50%); } }

/* ---------- ledger ---------- */
.pf-ledger {
  position: absolute; inset: 0; overflow-y: auto;
  padding: 96px 16px 120px;
}
.pf-ledger-head { margin-bottom: 14px; }
.pf-search {
  width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.25);
  color: #fff; font-family: inherit; font-size: 12px; letter-spacing: 0.16em; padding: 10px 0;
  text-transform: uppercase; outline: none;
}
.pf-search::placeholder { color: rgba(255,255,255,0.3); }
.pf-search:focus { border-color: var(--signal); }
.pf-row {
  display: flex; align-items: center; gap: 12px; width: 100%;
  background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.1);
  color: #fff; cursor: pointer; font-family: inherit; padding: 13px 2px; text-align: left;
  transition: background 120ms ease;
}
@media (hover:hover) { .pf-row:hover { background: var(--ikb); } }
.pf-row:active { background: var(--ikb); }
.pf-row-rank { font-size: 9px; letter-spacing: 0.14em; color: rgba(255,255,255,0.35); width: 22px; flex: none; }
.pf-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.pf-row-name {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase;
  font-size: 12.5px; line-height: 1.05;
}
.pf-row-sector { font-size: 8px; letter-spacing: 0.2em; color: rgba(255,255,255,0.4); text-transform: uppercase; }
.pf-row-score {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; font-size: 13px;
  display: inline-flex; align-items: center; gap: 7px; flex: none;
}
.pf-empty-ledger { position: static; padding: 60px 0; }

/* ---------- info card ---------- */
.pf-card-backdrop {
  position: absolute; inset: 0; z-index: 40;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  padding: 14px;
  animation: pf-fade 200ms ease;
}
.pf-card {
  width: 100%; max-width: 560px; max-height: calc(100% - 16px);
  background: #000; border: 1px solid rgba(255,255,255,0.22);
  display: flex; flex-direction: column; overflow: hidden;
  animation: pf-rise 260ms cubic-bezier(.2,.8,.2,1);
}
@keyframes pf-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pf-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

.pf-card-media { position: relative; height: 170px; flex: none; background: #0B0B0B; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.pf-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pf-card-mediascrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 45%); pointer-events: none; }
.pf-card-sigilbox { height: 100%; width: 100%; display: flex; align-items: center; justify-content: center; color: #fff; background: #000; }
.pf-card-x { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.55); }
.pf-card-counter { position: absolute; left: 12px; bottom: 10px; }

.pf-card-body { padding: 18px 18px 20px; overflow-y: auto; user-select: text; -webkit-user-select: text; }
.pf-detail-meta { display: flex; gap: 14px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
.pf-tiertag {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.7);
}
.pf-tiertag-path { color: var(--signal); }
.pf-card-name {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase;
  font-size: clamp(20px, 6vw, 34px); line-height: 1.0; margin: 0 0 16px;
  overflow-wrap: break-word;
}
.pf-card-scorerow { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 20px; }
.pf-card-score {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900;
  font-size: clamp(44px, 13vw, 72px); line-height: 0.9; margin-top: 6px;
}
.pf-card-minisigil { color: #fff; flex: none; }

.pf-bars { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.pf-bar-row { display: flex; align-items: center; gap: 12px; }
.pf-bar-label { font-size: 9px; letter-spacing: 0.2em; color: rgba(255,255,255,0.6); width: 58px; flex: none; }
.pf-bar-track { flex: 1; height: 4px; background: rgba(255,255,255,0.12); overflow: hidden; }
.pf-bar-fill {
  display: block; height: 100%; width: 100%; background: var(--ikb);
  transform-origin: left center; transition: transform 700ms cubic-bezier(.2,.8,.2,1);
}
.pf-bar-val {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; font-size: 11px; width: 30px; text-align: right; flex: none;
}
.pf-card-note { font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.78); margin: 0 0 18px; }

.pf-link {
  display: flex; justify-content: center; align-items: center; gap: 8px;
  border: 1px solid rgba(255,255,255,0.35); color: #fff; text-decoration: none;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  padding: 13px 0; margin-bottom: 10px; transition: all 140ms ease;
}
.pf-link:hover { background: var(--ikb); border-color: var(--ikb); }

.pf-detail-nav { display: flex; gap: 10px; }
.pf-navbtn {
  flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; cursor: pointer;
  font-family: inherit; font-size: 10px; letter-spacing: 0.2em; padding: 12px 0; text-transform: uppercase;
  transition: all 140ms ease;
}
.pf-navbtn:hover { background: var(--ikb); border-color: var(--ikb); }

/* close button */
.pf-x {
  background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; cursor: pointer;
  width: 34px; height: 34px; font-size: 18px; line-height: 1; font-family: inherit;
  transition: all 140ms ease;
}
.pf-x:hover { background: var(--ikb); border-color: var(--ikb); }

/* sigil animation */
.pf-sigil { display: block; }
.pf-sigil-anim .pf-ring { stroke-dasharray: 1; stroke-dashoffset: 1; animation: pf-ring 800ms cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes pf-ring { to { stroke-dashoffset: 0; } }

/* ---------- method overlay ---------- */
.pf-overlay {
  position: absolute; inset: 0; z-index: 50; background: #000;
  display: flex; flex-direction: column;
  animation: pf-rise 280ms cubic-bezier(.2,.8,.2,1);
}
.pf-overlay-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.12); flex: none;
}
.pf-detail-scroll { flex: 1; overflow-y: auto; padding: 26px 18px 40px; }
.pf-method-title {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase;
  font-size: clamp(20px, 6vw, 40px); line-height: 1.04; margin: 0 0 22px; max-width: 680px;
}
.pf-body { font-size: 14.5px; line-height: 1.7; color: rgba(255,255,255,0.78); max-width: 620px; margin: 0 0 18px; }
.pf-dim-note { font-size: 12px; color: rgba(255,255,255,0.45); }
.pf-method-grid { border-top: 1px solid rgba(255,255,255,0.14); margin: 26px 0; max-width: 620px; }
.pf-method-row {
  display: flex; gap: 14px; align-items: baseline; padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.pf-method-dim {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase; font-size: 11px;
  width: 132px; flex: none; display: inline-flex; align-items: center; gap: 8px;
}
.pf-method-w { font-size: 10px; letter-spacing: 0.1em; color: var(--signal); width: 40px; flex: none; }
.pf-method-desc { font-size: 12.5px; line-height: 1.5; color: rgba(255,255,255,0.6); }
.pf-mission {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase;
  font-size: 13px; line-height: 1.5; color: var(--signal); max-width: 520px; margin: 34px 0 14px;
}

/* ---------- responsive / motion ---------- */
@media (min-width: 760px) {
  .pf-hud-top { padding: 18px 24px 34px; }
  .pf-wm-line { font-size: 18px; }
  .pf-hud-controls { flex-direction: row; align-items: center; gap: 18px; }
  .pf-ledger { padding: 110px 24px 130px; max-width: 880px; margin: 0 auto; }
  .pf-detail-scroll { padding: 40px 24px 56px; max-width: 880px; margin: 0 auto; width: 100%; }
  .pf-row-name { font-size: 15px; }
  .pf-tile-name { font-size: 13px; }
  .pf-ticker { height: 30px; }
  .pf-ticker-seg { font-size: 10px; }
  .pf-card-media { height: 190px; }
}
@media (prefers-reduced-motion: reduce) {
  .pf-ticker-track { animation: none; }
  .pf-overlay, .pf-card, .pf-card-backdrop { animation: none; }
  .pf-sigil-anim .pf-ring { animation: none; stroke-dashoffset: 0; }
  .pf-bar-fill { transition: none; }
}
`;
