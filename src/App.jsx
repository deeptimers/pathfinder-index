import { useState, useEffect, useRef, useMemo, memo, useCallback, Fragment } from "react";

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

const CHAPTERS = [
  { id: "dt", name: "DEEP TIME THINKING", short: "DEEP TIME", line: "Building on the longest horizon", desc: "Operating on a timescale beyond short-term volatility, building for decades and centuries rather than quarters." },
  { id: "gl", name: "GRAVITATIONAL LEADERSHIP", short: "GRAVITATIONAL", line: "Depth and mastery that pulls rather than pushes", desc: "Refusing to compete for attention, becoming a field of attraction through uncompromising vision and craft." },
  { id: "oi", name: "THE OPTIMISM IMPERATIVE", short: "OPTIMISM", line: "The defiant insistence on a positive future", desc: "Treating optimism as discipline, painting and building a future in which humanity and the planet thrive." },
  { id: "cg", name: "THE CULTURE GRID", short: "CULTURE GRID", line: "Powering the flow of culture and ideas", desc: "Becoming the infrastructure that lets culture and knowledge flow between people, rather than extracting from it." },
  { id: "aa", name: "AMBITION ARCHITECTURE", short: "AMBITION", line: "Principles codified into structures that hold", desc: "Building the foundational systems, tools and principles that turn outsized ambition into something real." },
];
const CHAPTER = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));



const SECTORS = [
  { id: "art", label: "ART" },
  { id: "science", label: "SCIENCE" },
  { id: "culture", label: "CULTURE" },
];

/* name, sector, chapter, description, pov, url, wiki, instagram handle */
const E = (name, sector, chapter, desc, pov, url, wiki, ig, img) => ({
  name, sector, chapter, desc, pov,
  url: url || null,
  wiki: wiki || name,
  ig: ig || null,
  img: img || null,
});

const ENTRIES = [
  E("ANTHROPIC", "science", "aa", "American AI safety company founded in 2021 by former OpenAI researchers, and the developer of the Claude family of AI models. Its research focuses on making AI systems reliable, interpretable and steerable.", "Anthropic treats safety as architecture, codifying principles into the structures and research that make powerful AI trustworthy, ambition built to hold under pressure.", "https://www.anthropic.com", "Anthropic"),
  E("DEEPMIND", "science", "dt", "British-American AI laboratory founded in London in 2010 and now part of Google. Its AlphaFold system predicted the structures of over 200 million proteins, a landmark contribution to biology.", "Solving intelligence itself is the longest game there is, and DeepMind plays it patiently, treating the deepest scientific questions as the work of decades rather than product cycles.", "https://deepmind.google", "Google DeepMind"),
  E("NVIDIA", "science", "aa", "American technology company founded in 1993 whose graphics processors became the standard hardware for training modern AI systems, making it one of the most valuable companies in the world.", "Nvidia built the foundational layer the entire AI era runs on, the architecture beneath everyone else's ambition, turning a hardware company into critical infrastructure.", "https://www.nvidia.com", "Nvidia", "nvidia"),
  E("HUGGING FACE", "science", "aa", "American-French company that hosts the leading open platform for sharing machine learning models and datasets. Its open-source libraries, including Transformers, are foundational to modern AI development.", "Hugging Face built the open architecture for modern machine learning, the shared structure on which a whole field's ambition now rests.", "https://huggingface.co", "Hugging Face"),
  E("CENTER FOR HUMANE TECHNOLOGY", "science", "oi", "American non-profit founded in 2018 by former tech insiders, behind the film The Social Dilemma, working to realign technology with humanity's wellbeing and counter the attention-extraction and manipulation built into modern platforms.", "The Center for Humane Technology refuses the techno-dystopian default, insisting that technology can serve human flourishing and doing the work to realise it, optimism as active defiance.", "https://www.humanetech.com", "Center for Humane Technology"),
  E("RUNWAY", "science", "aa", "New York research company building generative AI tools for video and film, including the Gen series of video models. Its tools have been used in feature films and music videos.", "Runway is building the tools that turn the ambition of a new visual era into something creators can actually use, architecture for the future of making images.", "https://runwayml.com", "Runway (company)"),
  E("SPACEX", "science", "dt", "American aerospace company founded by Elon Musk in 2002 with the stated goal of making humanity multiplanetary. Developed the first orbital-class reusable rockets and operates the Starlink satellite network.", "Making life multiplanetary is the deepest time horizon a company can hold, an insurance policy on consciousness measured in centuries, and nobody dramatises the long arc of human ambition more vividly.", "https://www.spacex.com", "SpaceX", "spacex"),
  E("NASA", "science", "dt", "The United States' civil space agency, founded in 1958 and responsible for the Apollo Moon landings, the Space Shuttle, the James Webb Space Telescope and the Artemis programme returning humans to the Moon.", "NASA thinks in epochs, sending instruments on journeys that outlast the careers of the people who build them, and treating the expansion of human knowledge as a multigenerational duty.", "https://www.nasa.gov", "NASA", "nasa"),
  E("ESA", "science", "dt", "The intergovernmental space agency of more than 20 European states, founded in 1975 and headquartered in Paris. Its work spans Earth observation, the Ariane launchers and deep-space science missions such as Juice and Gaia.", "ESA builds for missions that report back decades after launch, holding a patient, civilisational view of what it means to understand our place in the cosmos.", "https://www.esa.int", "European Space Agency"),
  E("ROCKET LAB", "science", "aa", "American-New Zealand launch company founded by Peter Beck in 2006, whose Electron became one of the most frequently flown small rockets. Now developing the larger reusable Neutron launcher.", "Rocket Lab built dependable, repeatable access to space, the unshowy architecture that turns orbital ambition into routine, scheduled reality.", "https://www.rocketlabusa.com", "Rocket Lab"),
  E("AXIOM SPACE", "science", "aa", "American company founded in 2016, building the first commercial space station to succeed the ISS, and flying private astronaut missions to open up access to low Earth orbit.", "Axiom is building the first commercial space station, the literal architecture for living and working in orbit once the agencies step back.", "https://www.axiomspace.com", "Axiom Space"),
  E("RELATIVITY SPACE", "science", "aa", "Los Angeles launch company founded in 2015 and known for 3D printing the majority of its rockets. Flew Terran 1, the first largely 3D-printed rocket, in 2023 and is developing the reusable Terran R.", "Relativity is rethinking how rockets are made at the factory level, building the manufacturing architecture for a multiplanetary future rather than just the rockets.", "https://www.relativityspace.com", "Relativity Space"),
  E("STOKE SPACE", "science", "aa", "Seattle-area launch company founded in 2020 by Blue Origin and SpaceX veterans, developing Nova, a rocket designed to be fully and rapidly reusable from first stage to second.", "Stoke is engineering full reusability from first principles, building the foundational architecture that could make reaching orbit genuinely cheap.", "https://www.stokespace.com", "Stoke Space"),
  E("VARDA", "science", "aa", "Californian company founded in 2021 to manufacture pharmaceuticals in microgravity and return them to Earth in re-entry capsules. Has completed its first in-space drug processing missions.", "Varda is building the infrastructure to manufacture in orbit, the architecture for an entire new industry that does not yet exist on the ground.", "https://www.varda.com", "Varda Space Industries"),
  E("MSF", "science", "oi", "Mu00e9decins Sans Frontiu00e8res, the international humanitarian medical organisation founded in Paris in 1971. Delivers emergency care in conflict zones, epidemics and disasters, and was awarded the Nobel Peace Prize in 1999.", "MSF embodies optimism as agency, showing up where others have given up and refusing to accept suffering as inevitable, the disciplined belief that the world can be made better turned into action.", "https://www.msf.org", "Médecins Sans Frontières"),
  E("BIONTECH", "science", "aa", "German biotechnology company founded in Mainz in 2008, which developed the first approved mRNA vaccine with Pfizer during the COVID-19 pandemic. Now focused on mRNA-based cancer immunotherapies.", "BioNTech spent years building the mRNA platform before the world needed it, foundational architecture for medicine that turned patient principle into global impact.", "https://www.biontech.com", "BioNTech"),
  E("ISOMORPHIC LABS", "science", "aa", "London drug discovery company spun out of DeepMind in 2021, applying AlphaFold-derived AI to the design of new medicines. Led by DeepMind co-founder Demis Hassabis.", "Isomorphic is building the architecture to design medicines with AI, codifying the structure that could turn drug discovery from art into engineering.", "https://www.isomorphiclabs.com", "Isomorphic Labs"),
  E("NEURALINK", "science", "dt", "American neurotechnology company founded by Elon Musk in 2016, developing implantable brain-computer interfaces. Began first-in-human trials of its implant in 2024.", "Merging mind and machine is a civilisational bet rather than a near-term one, and Neuralink is building toward a future for human cognition that will unfold across generations.", "https://neuralink.com", "Neuralink"),
  E("CRISPR THERAPEUTICS", "science", "aa", "Swiss-American gene-editing company co-founded by Nobel laureate Emmanuelle Charpentier. Its therapy Casgevy, approved in 2023 for sickle cell disease, was the first CRISPR-based medicine to reach patients.", "CRISPR Therapeutics is turning a foundational tool for editing life into structured, approvable medicine, ambition made into a repeatable architecture.", "https://www.crisprtx.com", "CRISPR Therapeutics"),
  E("RECURSION", "science", "aa", "Salt Lake City biotechnology company founded in 2013, using automated experiments and machine learning to map cellular biology and discover drugs at industrial scale.", "Recursion built an industrial platform for biology, the architecture that turns drug discovery into something systematic, scalable and repeatable.", "https://www.recursion.com", "Recursion Pharmaceuticals"),
  E("MODERNA", "science", "aa", "American biotechnology company founded in 2010, a pioneer of messenger RNA medicine and maker of one of the principal COVID-19 vaccines. Developing mRNA treatments for cancer, flu and rare disease.", "Moderna treated mRNA as a platform rather than a product, foundational architecture for a new kind of medicine that can be pointed at problem after problem.", "https://www.modernatx.com", "Moderna"),
  E("COLOSSAL", "science", "oi", "Texas biosciences company founded in 2021, applying gene editing to de-extinction projects including the woolly mammoth, thylacine and dodo, alongside conservation biotechnology for endangered species.", "Colossal answers ecological grief with audacity, choosing to restore what was lost rather than mourn it, a defiantly hopeful vision of a wilder future.", "https://colossal.com", "Colossal Biosciences"),
  E("PATAGONIA", "culture", "gl", "American outdoor clothing company founded by Yvon Chouinard in 1973. In 2022 ownership was transferred to a trust and non-profit so that all profits fund climate action, with Earth described as the company's only shareholder.", "Patagonia built a world rather than a campaign, and its refusal to bend on what it stands for turned a clothing company into a gravitational force that imitation only makes more singular.", "https://www.patagonia.com", "Patagonia, Inc.", "patagonia"),
  E("COMMONWEALTH FUSION", "science", "dt", "MIT spin-out founded in 2018, building SPARC, a compact tokamak intended to demonstrate net-energy fusion. Backed by some of the largest private investment in fusion energy.", "Fusion is the ultimate long horizon, the energy source of the next century, and Commonwealth is doing the patient work of building it before the market is ready to reward it.", "https://cfs.energy", "Commonwealth Fusion Systems"),
  E("THE OCEAN CLEANUP", "science", "oi", "Dutch non-profit founded by Boyan Slat in 2013, developing systems to remove plastic from the Great Pacific Garbage Patch and to intercept it in rivers before it reaches the sea.", "The Ocean Cleanup refuses to accept a ruined ocean as the price of progress, building real machines toward a visibly better future, optimism made tangible.", "https://theoceancleanup.com", "The Ocean Cleanup"),
  E("ØRSTED", "science", "oi", "Danish energy company, formerly the oil and gas firm DONG Energy, which transformed itself into the world's largest developer of offshore wind power.", "Ørsted reinvented itself from fossil fuels to offshore wind, living proof that even the heaviest legacy can choose a positive future and build it.", "https://orsted.com", "Ørsted (company)"),
  E("CLIMEWORKS", "science", "oi", "Swiss company founded in 2009, operating the world's first commercial direct air capture plants in Iceland, which remove carbon dioxide from the atmosphere for permanent storage underground.", "Climeworks insists the carbon story can still be rewritten, pulling CO2 from the air as an act of defiant, engineered optimism about the planet's future.", "https://climeworks.com", "Climeworks"),
  E("FORM ENERGY", "science", "oi", "American battery company founded in 2017, developing iron-air batteries that can store energy for several days at a time, aimed at making renewable electricity grids reliable.", "Form Energy is building the long-duration storage that makes a fully renewable grid believable, the unshowy engineering behind a genuinely hopeful energy future.", "https://formenergy.com", "Form Energy"),
  E("TESLA", "science", "oi", "American electric vehicle and energy company led by Elon Musk, which brought EVs to the mass market and builds grid-scale battery storage and solar products.", "Tesla made the clean future desirable rather than dutiful, accelerating the energy transition by proving that optimism about the planet could also be aspirational.", "https://www.tesla.com", "Tesla, Inc.", "tesla"),
  E("HELION", "science", "dt", "Washington-state fusion company founded in 2013, developing a pulsed fusion generator. Holds a power purchase agreement with Microsoft, the first of its kind for fusion electricity.", "Helion is racing toward limitless clean energy on a timescale most investors cannot stomach, a bet whose payoff is measured in the transformation of civilisation itself.", "https://www.helionenergy.com", "Helion Energy"),
  E("INTERFACE", "science", "oi", "American modular flooring manufacturer that became a landmark of industrial sustainability under founder Ray Anderson, completing its Mission Zero programme in 2019 and now selling carbon-negative carpet tiles.", "Interface set out to prove a company could give more to the planet than it takes, a defiantly positive vision of industry it has spent decades making real.", "https://www.interface.com", "Interface, Inc."),
  E("ECOSIA", "science", "oi", "Berlin-based search engine founded in 2009 that uses its advertising profits to fund tree planting, with more than 200 million trees planted across the world to date.", "Ecosia turned an everyday action into reforestation, a quietly defiant insistence that the tools we already use can be redirected toward a better future.", "https://www.ecosia.org", "Ecosia"),
  E("CERN", "science", "dt", "The European Organization for Nuclear Research, founded in 1954 near Geneva, operates the Large Hadron Collider, where the Higgs boson was discovered in 2012. The World Wide Web was invented there in 1989.", "CERN exists to answer questions about the fundamental nature of reality, the slowest and deepest science there is, building instruments and collaborations designed to outlast nations.", "https://home.cern", "CERN"),
  E("LONG NOW FOUNDATION", "science", "dt", "San Francisco foundation established in 1996 to foster long-term thinking. Best known for building a monumental clock inside a Texas mountain, designed to keep time for 10,000 years.", "The Long Now is deep time made literal, championing a ten thousand year perspective as the antidote to short-termism and asking every institution to lengthen the horizon it plans against.", "https://longnow.org", "Long Now Foundation"),
  E("ITER", "science", "dt", "International fusion megaproject under construction in southern France, in which 35 nations are collaborating to build the world's largest tokamak and demonstrate fusion power at industrial scale.", "ITER is a multi-decade, multi-nation wager on fusion, proof that humanity can still cooperate on a timescale longer than any single government or career.", "https://www.iter.org", "ITER"),
  E("ARC INSTITUTE", "science", "dt", "Palo Alto research institute founded in 2021 in partnership with Stanford, Berkeley and UCSF, giving scientists long-term core funding to pursue curiosity-driven biomedical research.", "Arc backs scientists to chase the hardest problems in biology over years rather than grant cycles, betting that real breakthroughs come to those who think in decades.", "https://arcinstitute.org", "Arc Institute"),
  E("ALLEN INSTITUTE", "science", "dt", "Seattle non-profit research institute founded by Paul Allen in 2003, producing open atlases of the brain, the cell and the immune system that are shared freely with science.", "The Allen Institute treats understanding the brain as a generational endeavour, building open foundational science that will be drawn on long after its founders are gone.", "https://alleninstitute.org", "Allen Institute"),
  E("SANTA FE INSTITUTE", "science", "dt", "Independent New Mexico research institute founded in 1984 and the home of complexity science, studying common patterns across physical, biological and social systems.", "Santa Fe studies the deep patterns beneath complex systems, the kind of fundamental understanding that compounds slowly and reshapes how we see the world over decades.", "https://www.santafe.edu", "Santa Fe Institute"),
  E("MIT MEDIA LAB", "science", "aa", "Interdisciplinary research laboratory at MIT, founded in 1985 and known for work spanning wearable computing, learning technology, robotics and digital interfaces.", "The Media Lab is a structure built to invent the future across disciplines, the architecture that turns wild ambition into working prototypes.", "https://www.media.mit.edu", "MIT Media Lab"),
  E("FRANCIS CRICK INSTITUTE", "science", "dt", "Europe's largest biomedical laboratory under one roof, opened in London in 2016, where more than 2,000 scientists study the biology of health and disease.", "The Crick pursues the long, patient science of how life works, the foundational biology whose payoff arrives in medicine decades downstream.", "https://www.crick.ac.uk", "Francis Crick Institute"),
  E("MAX PLANCK SOCIETY", "science", "dt", "Germany's network of more than 80 basic research institutes, whose scientists have won dozens of Nobel Prizes for work spanning gravitational waves to ancient DNA.", "Max Planck has championed curiosity-driven fundamental research for over a century, proof that the most important science is a multigenerational commitment rather than a quarterly return.", "https://www.mpg.de", "Max Planck Society"),
  E("BROAD INSTITUTE", "science", "dt", "Genomic research institute of MIT and Harvard founded in 2004, a leader in CRISPR gene editing and in sharing large-scale genomic data openly for medicine.", "The Broad treats the genome as a resource for all of humanity, building open foundational tools whose value will compound across generations of medicine.", "https://www.broadinstitute.org", "Broad Institute"),
  E("ALAN TURING INSTITUTE", "science", "dt", "The UK's national institute for data science and artificial intelligence, founded in 2015 and named after the founder of computer science.", "Named for the man who imagined computing decades before it existed, the Turing Institute holds the long view on data science and AI as forces that will shape society for generations.", "https://www.turing.ac.uk", "Alan Turing Institute"),
  E("SETI INSTITUTE", "science", "dt", "Californian research institute founded in 1984, searching for life and intelligence beyond Earth with radio telescopes, AI and planetary science.", "Few questions are deeper or more patient than whether we are alone, and SETI listens across cosmic timescales, holding a perspective that dwarfs any human lifespan.", "https://www.seti.org", "SETI Institute"),
  E("ROYAL INSTITUTION", "science", "cg", "London home of science communication since 1799, where Faraday lectured and ten chemical elements were discovered, and whose Christmas Lectures have run since 1825.", "For two centuries the Royal Institution has been infrastructure for scientific wonder, taking discovery out of the lab and letting it flow to the public, the original grid for ideas.", "https://www.rigb.org", "Royal Institution"),
  E("PERIMETER INSTITUTE", "science", "dt", "Independent Canadian centre for theoretical physics founded in 1999, probing quantum gravity and the foundations of the universe while sharing its training freely online.", "Perimeter chases the deepest questions in theoretical physics, the kind whose answers may take generations to arrive and centuries to apply.", "https://perimeterinstitute.ca", "Perimeter Institute"),
  E("TATE MODERN", "culture", "cg", "Britain's national museum of modern and contemporary art, opened in a converted Bankside power station in 2000 and consistently among the most visited art museums in the world.", "Tate Modern is cultural infrastructure on a civic scale, a free and open conduit that lets contemporary art flow to millions rather than the few.", "https://www.tate.org.uk", "Tate Modern"),
  E("TEAMLAB", "art", "gl", "Tokyo art collective founded in 2001, creating immersive digital installations and the permanent Borderless and Planets museums, which draw millions of visitors a year.", "teamLab does not advertise, it draws pilgrims, the sheer depth and originality of its immersive worlds creating a field of attraction that pulls millions toward something they have never seen.", "https://www.teamlab.art", "TeamLab (art collective)"),
  E("A24", "art", "gl", "Independent New York film studio founded in 2012, producer and distributor of Moonlight, Everything Everywhere All at Once and Past Lives, and winner of multiple Best Picture Oscars.", "A24 became gravitational by trusting taste over formula, building a brand so clear that audiences now follow the logo itself, proof that conviction outperforms chasing the market.", "https://a24films.com", "A24", "a24"),
  E("MOMA", "culture", "cg", "The Museum of Modern Art in New York, founded in 1929, holds one of the most influential collections of modern and contemporary art in the world.", "MoMA built the grid for modern art, shaping how the world understands it and keeping that conversation flowing across generations.", "https://www.moma.org", "Museum of Modern Art"),
  E("V&A", "culture", "cg", "London's Victoria and Albert Museum, founded in 1852, is the world's largest museum of applied arts, decorative arts and design, with a collection spanning 5,000 years.", "The V&A is a vast, generous conduit for design and creativity, infrastructure that lets the story of human making flow to everyone who walks in.", "https://www.vam.ac.uk", "Victoria and Albert Museum"),
  E("SERPENTINE", "culture", "cg", "Pair of contemporary art galleries in London's Kensington Gardens, known for free exhibitions, a pioneering arts and technology programme and the annual Serpentine Pavilion architecture commission.", "The Serpentine powers the flow of new ideas in art and architecture, a small institution that punches far above its weight as a conductor of culture.", "https://www.serpentinegalleries.org", "Serpentine Galleries"),
  E("FACTORY INTERNATIONAL", "culture", "cg", "Manchester arts organisation behind the Manchester International Festival and Aviva Studios, a landmark venue for commissioning new work that opened in 2023.", "Factory International built a permanent home for ambitious culture in Manchester, infrastructure designed to let artists and audiences connect at a scale the city never had.", "https://factoryinternational.org", "Factory International"),
  E("GLASTONBURY", "culture", "cg", "The world's largest greenfield music and performing arts festival, held on a Somerset farm since 1970 and run by the Eavis family, with long-standing environmental commitments.", "Glastonbury is less a festival than a temporary city for culture, the grid through which a generation's music, ideas and values flow for one weekend a year.", "https://www.glastonburyfestivals.co.uk", "Glastonbury Festival"),
  E("PALACE", "culture", "gl", "London skateboard and clothing brand founded in 2009 by Lev Tanju, which grew from a skate crew into one of streetwear's most influential labels while remaining independent.", "Palace never explains itself, it just builds its own world with total creative sovereignty, and that refusal to court anyone is exactly what makes it irresistible.", "https://www.palaceskateboards.com", "Palace Skateboards"),
  E("BARBICAN", "culture", "cg", "Europe's largest multi-arts centre, opened in the City of London in 1982 within a celebrated Brutalist estate, housing concert halls, theatres, cinemas, galleries and a conservatory.", "The Barbican is a cathedral of culture under one roof, infrastructure that lets art, music, film and ideas cross-pollinate and flow to the public.", "https://www.barbican.org.uk", "Barbican Centre"),
  E("MEOW WOLF", "art", "gl", "American arts company that began as a Santa Fe collective in 2008, building permanent immersive art installations such as House of Eternal Return. Structured as a certified B Corporation.", "Meow Wolf turned uncompromising artistic vision into places people travel for, becoming gravitational not by reaching outward but by building something so singular it pulls people in.", "https://meowwolf.com", "Meow Wolf"),
  E("REFIK ANADOL", "art", "gl", "Turkish-American media artist who turns vast datasets into living architectural canvases, and whose work Unsupervised filled MoMA's lobby with machine dreams of its own collection.", "Refik Anadol made data into the sublime and owns that territory entirely, a depth of mastery so distinctive that the whole field of AI art now orbits his work.", "https://refikanadol.com", "Refik Anadol"),
  E("RANDOM INTERNATIONAL", "art", "gl", "London art collective best known for Rain Room, an indoor downpour that pauses wherever a visitor walks, exploring instinct, simulation and collective behaviour.", "Random International built a language of their own at the meeting point of art and engineering, and that singular mastery is what makes the world come to them.", "https://www.random-international.com", "Random International"),
  E("MARSHMALLOW LASER FEAST", "art", "gl", "London experiential art collective using virtual reality and breath-tracking to let audiences experience forests, oceans and the inside of the body.", "Marshmallow Laser Feast turned deep technical craft into wonder, becoming gravitational by making experiences so original that nobody can quite imitate them.", "https://www.marshmallowlaserfeast.com", "Marshmallow Laser Feast"),
  E("SOMERSET HOUSE", "culture", "cg", "Neoclassical London landmark turned creative community, home to hundreds of resident artists and makers, Somerset House Studios and a courtyard of fountains, film and ice.", "Somerset House turned a historic building into a living hub for the creative industries, infrastructure where culture is made and shared rather than merely displayed.", "https://www.somersethouse.org.uk", "Somerset House"),
  E("BOILER ROOM", "culture", "cg", "Hackney-based collective broadcasting DJ sets and live music from around the world since 2010, a platform that democratised access to electronic and experimental music.", "Boiler Room rewired club culture into a global grid, letting underground scenes flow to anyone anywhere and connecting communities that would never otherwise meet.", "https://boilerroom.tv", "Boiler Room (collective)"),
  E("WARP RECORDS", "culture", "cg", "Independent label born in Sheffield in 1989, home to Aphex Twin, Boards of Canada and Autechre, which defined the sound of electronic listening music.", "Warp is infrastructure for the future of music, a label that gives the most adventurous artists somewhere to go and lets their ideas flow into the wider culture.", "https://warp.net", "Warp (record label)"),
  E("NINJA TUNE", "culture", "cg", "Independent London label founded by Coldcut in 1990, an early leader on sustainability in music with a solar-powered headquarters and support for the Music Climate Pact.", "Ninja Tune has spent decades as a conduit for independent music, a label that powers the flow of new sound rather than chasing the centre.", "https://ninjatune.net", "Ninja Tune"),
  E("NTS RADIO", "culture", "cg", "Independent online radio station founded in Hackney in 2011, broadcasting from London, Manchester, Los Angeles and Shanghai with thousands of resident hosts and no playlists.", "NTS is a global grid for music discovery, an open platform that connects scenes and selectors across the world and keeps culture moving.", "https://www.nts.live", "NTS Radio"),
  E("BANDCAMP", "culture", "cg", "Online music platform founded in 2008 where fans buy directly from artists, paying out the large majority of every sale; its Bandcamp Fridays have channelled hundreds of millions of dollars to musicians.", "Bandcamp built the fairest pipe between artists and listeners, infrastructure that lets musicians thrive on their own terms and culture flow without a gatekeeper taking the current.", "https://bandcamp.com", "Bandcamp"),
  E("APPLE", "art", "gl", "American technology company founded in 1976, maker of the iPhone and Mac and the company that defined modern consumer hardware design. Aims for carbon neutrality across all its products by 2030.", "Apple never chases attention, it commands it, decades of refusing to compromise on the meeting of art and technology building a field of attraction so strong the industry orbits it.", "https://www.apple.com", "Apple Inc.", "apple"),
  E("TEENAGE ENGINEERING", "art", "gl", "Swedish electronics company founded in Stockholm in 2007, designing playful audio hardware such as the OP-1 synthesiser and collaborating with brands from IKEA to Nothing.", "Teenage Engineering answers to nobody but its own taste, and that creative sovereignty, executed with obsessive craft, is precisely what makes its work magnetic.", "https://teenage.engineering", "Teenage Engineering"),
  E("IKEA", "art", "gl", "Swedish furniture retailer founded by Ingvar Kamprad in 1943, whose flat-pack democratic design made good furniture affordable worldwide. Investing heavily in circular and renewable operations.", "IKEA made considered design gravitational at planetary scale, building a world so coherent and so clearly its own that it became the default rather than a competitor.", "https://www.ikea.com", "IKEA"),
  E("ABLETON", "art", "aa", "Berlin music software company founded in 1999 by musicians, maker of Ableton Live, a digital audio workstation built for performance as much as production, and the Push instrument.", "Ableton built the foundational architecture of modern music-making, the structure beneath countless artists' ambition rather than just another instrument.", "https://www.ableton.com", "Ableton"),
  E("IDEO", "art", "aa", "Global design consultancy formed in Palo Alto in 1991, which popularised design thinking and human-centred design across products, services and organisations.", "IDEO codified human-centred design into a method the world could use, turning a way of thinking into durable architecture for how things get made.", "https://www.ideo.com", "IDEO"),
  E("MUJI", "art", "gl", "Japanese retailer founded in 1980 around the idea of no-brand quality goods, selling simple, functional products with an ethos of sufficiency and restraint.", "Muji championed the quiet power of restraint, a philosophy so disciplined and complete that it became a category of one, pulling people toward less rather than more.", "https://www.muji.com", "Muji"),
  E("PENTAGRAM", "art", "gl", "The world's largest independent design consultancy, founded in London in 1972 and owned entirely by its partners, who each lead their own creative teams.", "Pentagram earns its pull through sheer depth of craft, an independent partnership whose mastery is so respected that the work speaks long before the pitch begins.", "https://www.pentagram.com", "Pentagram (design firm)"),
  E("NOTHING", "art", "gl", "London consumer technology company founded by Carl Pei in 2020, building smartphones and earbuds with a distinctive transparent design language.", "Nothing built desire from clarity of vision rather than spec sheets, proving that a young brand can become gravitational simply by knowing exactly what it stands for.", "https://nothing.tech", "Nothing (company)"),
  E("FRAMEWORK", "science", "aa", "San Francisco company founded in 2019, making modular laptops designed to be repaired and upgraded by their owners, a working proof of the right-to-repair movement.", "Framework rebuilt the laptop around principle, an architecture of repairability and longevity that turns a belief about better technology into something you can actually buy.", "https://frame.work", "Framework Computer"),
  E("IONQ", "science", "aa", "American quantum computing company founded in 2015 from University of Maryland and Duke research, building trapped-ion quantum computers accessible through the major cloud platforms.", "IonQ is building the foundational hardware for quantum computing, the architecture beneath a technology that could reshape what computation can do.", "https://ionq.com", "IonQ"),
  E("FAIRPHONE", "science", "oi", "Dutch social enterprise founded in 2013, making modular, repairable smartphones with fairly sourced materials and transparent supply chains.", "Fairphone refuses the throwaway logic of its own industry, building ethical, repairable technology as a hopeful argument that things can be made the right way.", "https://www.fairphone.com", "Fairphone"),
  E("TERRAFORMATION", "science", "oi", "American startup founded by Kohala Center veteran Yishan Wong in 2020, building tools and seed banks to accelerate global reforestation as a scalable, natural solution to climate change.", "Terraformation treats the climate fight as winnable, scaling forests as a defiantly optimistic answer to a problem most people find paralysing.", "https://www.terraformation.com", "Terraformation"),
  E("WIKIPEDIA", "culture", "cg", "The free encyclopaedia, launched in 2001 and written collaboratively by volunteers, now spanning tens of millions of articles in more than 300 languages. Operated by the non-profit Wikimedia Foundation.", "Wikipedia is pure grid, existing to let human knowledge flow freely between people, owned by no one and powering everyone, the closest thing the internet has to public infrastructure for ideas.", "https://www.wikipedia.org", "Wikipedia"),
  E("RASPBERRY PI", "culture", "aa", "Cambridge-based charity founded in 2008 to put affordable computing into young people's hands. Its tiny single-board computers have sold in the tens of millions worldwide.", "Raspberry Pi built the architecture of access, a tiny, affordable structure that put the power to build and learn into millions of hands.", "https://www.raspberrypi.org", "Raspberry Pi Foundation"),
  E("EDEN PROJECT", "culture", "oi", "Cornish educational charity built in a former clay pit, whose giant biomes house the world's largest indoor rainforest and teach regeneration at scale.", "The Eden Project turned an exhausted clay pit into a celebration of what is possible, a living, Solarpunk argument that humanity and nature can flourish together.", "https://www.edenproject.com", "Eden Project"),
  E("BREAKTHROUGH ENERGY", "science", "oi", "Network founded by Bill Gates in 2015, investing patient capital in early-stage climate technologies, from fusion and long-duration batteries to green steel and sustainable aviation fuel.", "Breakthrough Energy backs the technologies that make a zero-carbon future credible, capital deployed as an act of disciplined optimism about what we can still build.", "https://www.breakthroughenergy.org", "Breakthrough Energy"),
  E("SNØHETTA", "art", "oi", "Norwegian architecture studio behind the Oslo Opera House and the Powerhouse series of energy-positive buildings, which produce more energy than they consume over their lifetime.", "Snøhetta designs buildings that give back more than they take, a practice rooted in the belief that architecture can model a more generous future.", "https://www.snohetta.com", "Snøhetta"),
  E("BJARKE INGELS GROUP", "art", "oi", "Copenhagen and New York architecture practice founded by Bjarke Ingels, whose CopenHill power plant doubles as a ski slope and whose Masterplanet project imagines a sustainable redesign of Earth.", "BIG champions the idea that the sustainable future can also be joyful, dramatising optimism into buildings that make a better world feel desirable rather than dour.", "https://big.dk", "Bjarke Ingels Group"),
  E("STUDIO ROOSEGAARDE", "art", "oi", "Dutch social design lab founded by Daan Roosegaarde, building landscapes of the future that merge technology and nature, from smog-eating towers to luminous solar fields.", "Studio Roosegaarde is Solarpunk made real, designing dreamscapes that insist technology and nature can combine into a future worth wanting.", "https://www.studioroosegaarde.net", "Daan Roosegaarde"),
  E("STONE ISLAND", "art", "gl", "Italian clothing company founded in 1982, renowned for pioneering garment dyeing and material research, with an archive of hundreds of experimental fabrics that made it a cult name in design and menswear.", "Stone Island turned obsessive material research into a cult, a depth of mastery so real that devotion to the badge needs no marketing at all.", "https://www.stoneisland.com", "Stone Island"),
  E("NEXUS STUDIOS", "art", "gl", "London and Los Angeles animation and innovation studio founded in 2000, creating award-winning films, immersive experiences and augmented reality for brands including Apple, Google and Nike.", "Nexus draws the world's most ambitious creative work through the depth of its craft, a studio whose mastery is its own form of gravity.", "https://nexusstudios.com", "Nexus Studios"),
  E("ROLAND", "art", "gl", "Japanese electronic instrument company founded in 1972, whose TR-808 drum machine, TB-303 and synthesizers defined the sound of hip-hop, techno and house, shaping modern music for half a century.", "Roland's instruments did not chase trends, they defined the sound of entire genres, a mastery so foundational that culture keeps returning to it decades on.", "https://www.roland.com", "Roland Corporation"),
  E("UNITED VISUAL ARTISTS", "art", "gl", "London art and design studio founded by Matt Clark in 2003, producing large-scale light sculptures and installations that explore perception, time and natural phenomena.", "UVA built a singular language of light and space through deep technical command, work so distinctive that it pulls collaborators and audiences into its orbit.", "https://uva.co.uk", "United Visual Artists"),
  E("RYOJI IKEDA", "art", "gl", "Japanese media artist working with light, sound and data, whose Datamatics project visualises the sublime in terabytes, and whose installations turn mathematics into sensory experience.", "Ikeda goes deeper into data and sound than anyone, with total creative sovereignty, and that uncompromising depth is exactly what makes his work gravitational.", "https://www.ryoji-ikeda.com", "Ryoji Ikeda"),
  E("SUPERBLUE", "art", "aa", "American enterprise founded by Pace Gallery in 2020, building large-format experiential art centres where audiences step inside the work of artists such as teamLab.", "Superblue built a new structure for experiential art to exist and sustain itself, the architecture that turns ambitious immersive work into something the public can reach.", "https://www.superblue.com", "Superblue"),
  E("NAOSHIMA", "art", "gl", "Japanese island in the Seto Inland Sea reborn as a contemporary art destination through the Benesse Art Site, home to Tadao Ando museums and works by James Turrell and Yayoi Kusama.", "Naoshima turned a remote island into a place people cross the world to reach, gravitational not through promotion but through the sheer conviction of its vision.", "https://benesse-artsite.jp", "Naoshima"),
  E("SÓNAR", "culture", "cg", "Barcelona festival of advanced music and creative technology, held since 1994, pairing club culture with a congress on art, science and the future.", "Sónar is the meeting point where music, art and technology flow together, infrastructure for the conversation about where culture and the future collide.", "https://sonar.es", "Sónar"),
  E("MUTEK", "culture", "cg", "Montreal festival founded in 2000, dedicated to electronic music and digital creativity, with sister editions across the Americas, Europe and Asia.", "MUTEK connects the global community of digital creativity, a conduit that lets electronic music and audiovisual art flow across borders.", "https://mutek.org", "Mutek"),
  E("NXT MUSEUM", "culture", "cg", "Amsterdam museum opened in 2020, the first in the Netherlands devoted to new media art, presenting large-scale digital and sensory installations.", "Nxt Museum built a permanent home for new media art, infrastructure that lets a new generation of digital culture reach the public.", "https://nxtmuseum.com", "Nxt Museum"),
  E("DESIGN MUSEUM", "culture", "cg", "London museum of contemporary design and architecture, relocated to Kensington in 2016, whose exhibitions and Designer of the Year award shape design discourse.", "The Design Museum is a conduit for understanding the designed world, infrastructure that lets the ideas shaping our lives flow to everyone.", "https://designmuseum.org", "Design Museum"),
  E("180 STUDIOS", "culture", "cg", "London cultural space on the Strand presenting ambitious digital art and design exhibitions, from immersive light and sound to major surveys of new media.", "180 Studios turned a Brutalist landmark into a stage for boundary-pushing digital art, infrastructure that channels the most ambitious new culture to the public.", "https://180studios.com", "180 The Strand"),
  E("ZKM", "culture", "cg", "German Centre for Art and Media in Karlsruhe, founded in 1989, a leading museum and research institution at the meeting point of art, science and digital technology.", "ZKM has spent decades as infrastructure for art and technology, a conduit that lets the conversation between the two flow and endure.", "https://zkm.de", "ZKM Center for Art and Media"),
  E("VOLLEBAK", "art", "oi", "British clothing company founded in 2015 by twin brothers, making experimental garments from advanced materials like graphene, ceramic and biodegradable fibres, designed around science, survival and the far future.", "Vollebak explores the future for the sheer love of it, treating clothing as a canvas for optimism about science, materials and what comes next.", "https://vollebak.com", "Vollebak"),
  E("AEON", "culture", "cg", "London digital magazine publishing long-form essays and beautifully-produced videos on science, philosophy, psychology and ideas, with a visual design and editorial rigour that treats complex thinking as an art form.", "Aeon treats deep ideas as something to be shared widely and well, a quiet but vital piece of infrastructure for serious thinking in a noisy world.", "https://aeon.co", "Aeon (magazine)"),
];

const linkFor = (e) => e.url || `https://en.wikipedia.org/wiki/${encodeURIComponent(e.wiki.replace(/ /g, "_"))}`;
const isWikiLink = (e) => !e.url;

const CH_ORDER = { dt: 0, gl: 1, oi: 2, cg: 3, aa: 4 };
const RANKED_ALL = ENTRIES.slice().sort(
  (a, b) => (CH_ORDER[a.chapter] - CH_ORDER[b.chapter]) || a.name.localeCompare(b.name)
);

/* Spread a list so the same sector rarely sits next to itself. Greedy: at each
   step pick the highest-ranked remaining entry whose sector differs from the
   previous one or two placed, and from the entry one row up, falling back to
   best-available when every remaining option clashes. */
function spreadBySector(list, rowShift) {
  const pool = list.slice();
  const result = [];
  const recentlyBad = (ch, idx) => {
    const prev = result[idx - 1];
    const prev2 = result[idx - 2];
    const up = idx - rowShift >= 0 ? result[idx - rowShift] : null;
    return (
      (prev && prev.chapter === ch) ||
      (prev2 && prev2.chapter === ch) ||
      (up && up.chapter === ch)
    );
  };
  while (pool.length) {
    const idx = result.length;
    let pick = pool.findIndex((e) => !recentlyBad(e.chapter, idx));
    if (pick === -1) {
      const prev = result[idx - 1];
      pick = pool.findIndex((e) => !prev || e.chapter !== prev.chapter);
      if (pick === -1) pick = 0;
    }
    result.push(pool.splice(pick, 1)[0]);
  }
  return result;
}

const mod = (n, m) => ((n % m) + m) % m;

const IMG_RESOLVED = new Map(); // id -> resolved src, or null when all candidates failed

function useEntryImage(entry) {
  const id = entry.img || slug(entry.name);
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



/* ---------- tile ---------- */
const Tile = memo(function Tile({ entry, w, h, onOpen }) {
  const chapter = CHAPTER[entry.chapter];
  const { src, onError, onLoad } = useEntryImage(entry);
  return (
    <button
      className={`pf-tile ${src ? "" : "pf-tile-sigilmode"}`}
      style={{ width: w, height: h }}
      data-pfname={entry.name}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(entry); }
      }}
      aria-label={`${entry.name}, ${chapter ? chapter.name : ""}`}
    >
      <span className="pf-tile-top">
        <span className="pf-tile-sector">{chapter ? chapter.short : ""}</span>
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
          <span className="pf-tile-fallback">{entry.name}</span>
        )}
      </span>
      {src && <span className="pf-tile-name">{entry.name}</span>}
    </button>
  );
});

/* ---------- infinite field ---------- */
function InfiniteField({ list, cell, onOpen, reduced }) {
  const { w, h, gap } = cell;
  const CW = w + gap;
  const CH = h + gap;
  const camRef = useRef({ x: Math.random() * 6000 + 17, y: Math.random() * 6000 + 23 });
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
        const nc = Math.floor(cam.x / CW) - 2;
        const nr = Math.floor(cam.y / CH) - 2;
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
      velRef.current.x = velRef.current.x * 0.5 + (-dx) * 0.5;
      velRef.current.y = velRef.current.y * 0.5 + (-dy) * 0.5;
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

  const cols = CW > 0 ? Math.ceil(vp.vw / CW) + 4 : 0;
  const rows = CH > 0 ? Math.ceil(vp.vh / CH) + 4 : 0;

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
  const chapter = CHAPTER[entry.chapter];
  const sector = SECTORS.find((s) => s.id === entry.sector);
  const { src, onError, onLoad } = useEntryImage(entry);

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
        <div className={`pf-card-media ${src ? "" : "pf-card-media-empty"}`}>
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
          ) : null}
          <button className="pf-x pf-card-x" onClick={onClose} aria-label="Close">×</button>
          <span className="pf-card-counter pf-mono">{String(idx + 1).padStart(2, "0")} / {ranked.length}</span>
        </div>

        <div className="pf-card-body">
          <div className="pf-detail-meta">
            <span className="pf-mono">{sector ? sector.label : ""}</span>
          </div>
          <h2 className="pf-card-name">{entry.name}</h2>

          {entry.pov && <p className="pf-card-pov">{entry.pov}</p>}
          {chapter && <div className="pf-card-chaptag pf-mono">{chapter.name}</div>}
          <p className="pf-card-note">{entry.desc}</p>

          <a className="pf-link" href={href} target="_blank" rel="noopener noreferrer">
            {wikiLink ? "READ ON WIKIPEDIA" : "VISIT SITE"} <span aria-hidden="true">↗</span>
          </a>
          {entry.ig && (
            <a className="pf-link" href={`https://www.instagram.com/${entry.ig}/`} target="_blank" rel="noopener noreferrer">
              INSTAGRAM <span aria-hidden="true">↗</span>
            </a>
          )}

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
  const roman = ["I", "II", "III", "IV", "V"];
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
          There is no score. Inclusion is the verdict. Each of the {total} entries is presented as the embodiment of one
          of the five Pathfinder chapters, the characteristics, drawn from the Deep Time manifesto, that define a brand
          building the future. The index is curated by Deep Time and rebalanced as the world moves.
        </p>

        <div className="pf-method-grid">
          {CHAPTERS.map((c, i) => (
            <div className="pf-method-row" key={c.id}>
              <span className="pf-method-dim">{c.name}</span>
              <span className="pf-method-w">{roman[i]}</span>
              <span className="pf-method-desc">{c.desc}</span>
            </div>
          ))}
        </div>

        <p className="pf-body pf-dim-note">
          Descriptions are drawn from each entry's public record. Imagery is curated by Deep Time; entries awaiting an
          image show their sigil, a glyph drawn from the chapter they embody.
        </p>

        <p className="pf-body">
          The index descends from a lineage of visionaries who painted the future as something worth reaching: the novelists Arthur C Clarke, Iain M Banks, Stanisław Lem and Olaf Stapledon, the planetary imagination of film-makers such as Christopher Nolan, and the Solarpunk movement, which insists that a bright, living and sustainable future is ours to build. They are not entries, because they cannot be partners, but they are the conviction beneath every tile.
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
  let lastCh = null;
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
        const chapter = CHAPTER[e.chapter];
        const sector = SECTORS.find((s) => s.id === e.sector);
        let head = null;
        if (e.chapter !== lastCh) { head = chapter; lastCh = e.chapter; }
        return (
          <Fragment key={e.name}>
            {head && <div className="pf-ledger-group pf-mono">{head.name}</div>}
            <button className="pf-row" onClick={() => onOpen(i)}>
              <span className="pf-row-rank">{String(i + 1).padStart(2, "0")}</span>
              <span className="pf-row-main">
                <span className="pf-row-name">{e.name}</span>
                <span className="pf-row-sector">{sector ? sector.label : ""}</span>
              </span>
            </button>
          </Fragment>
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
    if (filter !== "all") list = list.filter((e) => e.chapter === filter);
    if (view === "index" && query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q));
    }
    return list;
  }, [filter, query, view]);

  const fieldList = useMemo(() => {
    let list = RANKED_ALL;
    if (filter !== "all") return list.filter((e) => e.chapter === filter);
    const N = list.length;
    const rowShift = [7, 11, 13, 17, 19, 5, 3].find((k) => N % k !== 0) || 1;
    return spreadBySector(list, rowShift);
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
    CHAPTERS.forEach((c) => (m[c.id] = RANKED_ALL.filter((e) => e.chapter === c.id).length));
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
          {CHAPTERS.map((c) => (
            <button key={c.id} className={`pf-pill ${filter === c.id ? "on" : ""}`} onClick={() => setFilter(c.id)}>
              {c.short} <span className="pf-pill-n">{counts[c.id]}</span>
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
.pf-img { width: 100%; height: 100%; object-fit: contain; display: block; transition: transform 260ms ease; }

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
.pf-card-pov { font-size: 15px; line-height: 1.55; color: rgba(255,255,255,0.96); margin: 0 0 14px; }
.pf-card-note { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.6); margin: 0 0 18px; }

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
  width: 150px; flex: none; display: inline-flex; align-items: center; gap: 8px;
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

/* ---------- chapter ---------- */
.pf-card-chaprow { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin: 2px 0 20px; }
.pf-card-chapwrap { min-width: 0; }
.pf-card-chaplabel { font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
.pf-card-chap {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase;
  font-size: clamp(19px, 5.2vw, 28px); line-height: 1.04; margin-top: 8px; color: var(--signal);
  overflow-wrap: break-word;
}
.pf-card-chapline { font-size: 13px; line-height: 1.5; color: rgba(255,255,255,0.6); margin-top: 10px; max-width: 42ch; }
.pf-ledger-group { padding: 24px 4px 8px; color: rgba(255,255,255,0.5); }
.pf-row-glyph { color: #fff; opacity: 0.55; flex: none; display: inline-flex; }

/* ---------- imageless + chapter tag ---------- */
.pf-tile-fallback {
  font-family: 'Druk Wide', 'Druk Wide Web', 'Archivo', sans-serif;
  font-stretch: 125%; font-weight: 900; text-transform: uppercase;
  font-size: clamp(13px, 2.1vw, 20px); line-height: 1.05; letter-spacing: 0.01em;
  color: rgba(255,255,255,0.92); text-align: center; padding: 10px; overflow-wrap: break-word;
}
.pf-card-media-empty { height: 96px; background: linear-gradient(180deg, #161616, #000); }
.pf-card-chaptag { margin: 0 0 16px; color: rgba(255,255,255,0.5); }
`;
