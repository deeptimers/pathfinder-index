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
  { key: "v", label: "VISION", weight: 0.25, desc: "The ambition and originality of where they want to take us" },
  { key: "i", label: "IMPACT", weight: 0.25, desc: "The scale of real-world change they have actually delivered" },
  { key: "s", label: "SIGNAL", weight: 0.25, desc: "Their cultural influence and visibility" },
  { key: "b", label: "BELIEF", weight: 0.25, desc: "The conviction and authenticity of their mission" },
];

const TIERS = [
  { name: "PATHFINDER", min: 4.25, desc: "Setting the route for everyone else" },
  { name: "NAVIGATOR", min: 3.5, desc: "Steering with intent" },
  { name: "EXPLORER", min: 2.9, desc: "Searching for the path" },
  { name: "PASSENGER", min: 0, desc: "Along for the ride" },
];

const SECTORS = [
  { id: "art", label: "ART" },
  { id: "science", label: "SCIENCE" },
  { id: "culture", label: "CULTURE" },
];

/* name, sector, v(ision), i(mpact), s(ignal), b(elief), description, url, wiki title */
const E = (name, sector, v, i, s, b, desc, url, wiki, img) => ({
  name, sector, v, i, s, b, desc,
  url: url || null,
  wiki: wiki || name,
  img: img || null,
});

const ENTRIES = [
  E("ANTHROPIC", "science", 5.0, 3.5, 4.0, 4.5, "Anthropic builds frontier AI with safety as its founding premise, betting that the most powerful technology of the century has to be made trustworthy before it is made ubiquitous. Its Claude models sit among the best in the world, and its research into interpretability and alignment shapes how the whole field thinks about risk. The vision is vast, the public profile now considerable, and the conviction runs through everything it publishes.", "https://www.anthropic.com", "Anthropic"),
  E("DEEPMIND", "science", 4.8, 4.3, 4.3, 3.8, "DeepMind set out to solve intelligence and then use it to solve everything else, and with AlphaFold it delivered one of the genuine scientific gifts of the era, mapping the structure of nearly every known protein. Now folded into Google, it remains the most decorated AI lab in the world. The ambition is real and the impact already written into biology, though its mission now shares a desk with commercial priorities.", "https://deepmind.google", "Google DeepMind"),
  E("NVIDIA", "science", 3.8, 5.0, 4.5, 2.8, "Nvidia makes the chips the entire AI era runs on, which gives it world-changing impact even if its vision is more about enabling others than charting a destination of its own. Almost every model you have heard of was trained on its hardware. The cultural profile is now enormous, but the engine of the company is commercial rather than missionary.", "https://www.nvidia.com", "Nvidia"),
  E("HUGGING FACE", "science", 3.8, 3.8, 3.5, 4.2, "Hugging Face is the open commons of machine learning, the place where a vast share of the world's models and datasets are shared, downloaded and built upon. It champions an open, collaborative future for AI against the pull of closed labs. The reach is wide within the field and the open-source conviction genuine, even if it stays less visible to the public than the giants it counterbalances.", "https://huggingface.co", "Hugging Face"),
  E("AI2", "science", 3.8, 3.2, 2.8, 4.2, "The Allen Institute for AI pursues artificial intelligence for the common good as a non-profit, releasing open models and tools at a time when the frontier is mostly locked behind corporate walls. Its work on open language models gives researchers an alternative they can actually inspect. The footprint is real if modest, and the public-good mission is the whole point rather than a footnote.", "https://allenai.org", "Allen Institute for AI"),
  E("RUNWAY", "science", 4.0, 3.0, 3.3, 3.0, "Runway is rewriting what a camera and an edit suite can be, putting generative video tools into the hands of film-makers and artists. Its models helped open the door to a new visual language now spreading across the industry. The vision is forward-leaning, though the body of real-world work is still young and the mission largely commercial.", "https://runwayml.com", "Runway (company)"),
  E("SPACEX", "science", 5.0, 4.5, 4.8, 4.0, "SpaceX exists to make humanity multiplanetary, and in pursuit of that it has already rewritten the economics of spaceflight with reusable rockets that land themselves. It now launches more mass to orbit than the rest of the world combined. Few visions are larger, few have been backed by harder engineering, and few brands in the field carry more weight.", "https://www.spacex.com", "SpaceX"),
  E("NASA", "science", 4.5, 5.0, 4.8, 4.3, "NASA defined the space age and still sets the horizon for it, from the Moon landings to the telescopes now reading the chemistry of distant worlds. Its science underpins much of what we know about Earth and the cosmos alike. The impact is civilisational, the public standing iconic, and the institutional belief in exploration intact after seven decades.", "https://www.nasa.gov", "NASA"),
  E("ESA", "science", 3.8, 4.0, 3.5, 3.8, "The European Space Agency carries the continent's ambitions in orbit and beyond, from Earth observation that tracks the climate to missions that have landed on comets. It does serious science with a collaborative, multinational ethos. The vision is solid and the impact substantial, if less singular and less loudly told than its American counterpart.", "https://www.esa.int", "European Space Agency"),
  E("ROCKET LAB", "science", 3.5, 3.5, 3.0, 3.3, "Rocket Lab opened up small-satellite launch, proving there was room for a nimble second mover beneath the heavy lifters and building a genuine end-to-end space business. It now reaches for larger rockets and spacecraft of its own. The execution is impressive and the ambition steadily growing, though it sits a tier below the field's boldest visions.", "https://www.rocketlabusa.com", "Rocket Lab"),
  E("PLANET LABS", "science", 3.5, 3.5, 2.8, 3.5, "Planet Labs images the entire Earth every day with a flock of small satellites, turning the planet into a searchable, living dataset used for everything from climate monitoring to disaster response. The infrastructure is quietly remarkable and genuinely useful. The mission is meaningful and the impact real, even if the brand stays largely behind the scenes.", "https://www.planet.com", "Planet Labs"),
  E("RELATIVITY SPACE", "science", 4.0, 2.5, 2.8, 3.2, "Relativity Space wants to 3D-print entire rockets, compressing the supply chain into a handful of giant printers and pointing at a future of factories on other worlds. It is a bold reimagining of how things get built off-planet. The vision is striking but the record is still early, with much of the promise yet to fly.", "https://www.relativityspace.com", "Relativity Space"),
  E("STOKE SPACE", "science", 4.0, 2.0, 2.3, 3.2, "Stoke Space is chasing the harder half of reusability, a fully reusable rocket including the upper stage, which would push launch costs down further than anyone has managed. The engineering bet is ambitious and clear-eyed. It remains a very early-stage company, so the score reflects promise far more than proven impact.", "https://www.stokespace.com", "Stoke Space"),
  E("VARDA", "science", 4.0, 2.0, 2.3, 3.0, "Varda is building factories in orbit, manufacturing pharmaceuticals and materials in microgravity and returning them to Earth in its own capsules. The idea of space as an industrial site is a genuinely new frontier. The vision is bold, the early returns small, and the venture is still proving the concept rather than scaling it.", "https://www.varda.com", "Varda Space Industries"),
  E("MSF", "science", 3.5, 5.0, 4.0, 5.0, "Medecins Sans Frontieres delivers medical care to people the world has largely abandoned, in war zones, epidemics and disasters, without regard to politics. Its impact is measured in millions of lives and its independence is fiercely guarded. The vision is humanitarian rather than futurist, but on impact and conviction there are few organisations on Earth to match it.", "https://www.msf.org", "Médecins Sans Frontières"),
  E("BIONTECH", "science", 4.0, 4.8, 3.8, 4.0, "BioNTech spent years building an mRNA platform that most of the world ignored, then used it to help deliver a COVID vaccine at a speed once thought impossible. That same technology now points at personalised cancer treatment. The impact is already historic, the vision genuinely large, and the science-led conviction evident.", "https://www.biontech.com", "BioNTech"),
  E("ISOMORPHIC LABS", "science", 4.5, 2.5, 2.8, 3.8, "Isomorphic Labs, spun out of DeepMind, wants to rebuild drug discovery around AI, treating disease as a problem that can be modelled and solved computationally. If it works, it reshapes medicine. The ambition is enormous and the pedigree serious, but the company is young and its impact still mostly ahead of it.", "https://www.isomorphiclabs.com", "Isomorphic Labs"),
  E("NEURALINK", "science", 4.8, 2.5, 4.0, 3.0, "Neuralink is building a high-bandwidth brain-computer interface, aiming first to restore movement and communication to the paralysed and ultimately to merge mind and machine. The vision is among the boldest in technology and its first human implants have begun. The hype outpaces the evidence for now, and the mission can be hard to separate from its founder's showmanship.", "https://neuralink.com", "Neuralink"),
  E("CRISPR THERAPEUTICS", "science", 4.2, 3.5, 3.0, 3.8, "CRISPR Therapeutics turns gene editing into actual medicine, and its sickle-cell therapy became one of the first CRISPR treatments approved anywhere, a genuine landmark for the field. It points toward a future where inherited disease can be rewritten at the source. The vision is profound and the first real impact now on the record.", "https://www.crisprtx.com", "CRISPR Therapeutics"),
  E("RECURSION", "science", 3.8, 2.8, 2.5, 3.3, "Recursion industrialises biology, running millions of automated experiments and letting machine learning find the patterns that lead to new drugs. It is a bet that the laboratory can become a data-generating machine. The approach is forward-looking, though its clinical impact is still emerging and its profile largely confined to the industry.", "https://www.recursion.com", "Recursion Pharmaceuticals"),
  E("MODERNA", "science", 3.8, 4.8, 3.8, 3.3, "Moderna proved the mRNA thesis at planetary scale with its COVID vaccine, and is now turning the platform toward a pipeline of vaccines and therapies. The real-world impact has already been measured in hundreds of millions of doses. The science is genuinely transformative, even if the company now operates as a commercially-driven pharmaceutical major.", "https://www.modernatx.com", "Moderna"),
  E("COLOSSAL", "science", 4.3, 2.3, 3.5, 2.8, "Colossal is attempting to bring back the mammoth and other lost species, using de-extinction as both a conservation tool and a spectacle that funds the science. The vision is audacious and the storytelling formidable. The actual results are early and the scientific community is divided on whether the promise is substance or showmanship.", "https://colossal.com", "Colossal Biosciences"),
  E("PATAGONIA", "culture", 4.3, 4.0, 4.3, 5.0, "Patagonia is the closest thing business has to a conscience, treating the company as a tool to save the planet and going so far as to give itself away to fund the fight. Its environmental action is real, not rhetorical. The vision, the impact and above all the conviction make it the standard every purpose-led brand is measured against.", "https://www.patagonia.com", "Patagonia, Inc."),
  E("COMMONWEALTH FUSION", "science", 4.8, 2.8, 3.2, 4.0, "Commonwealth Fusion Systems is racing to build a fusion power plant that puts more energy in than it takes out, using high-temperature superconducting magnets to make the reactor smaller and sooner. If it succeeds, it changes the energy story of the century. The vision is about as large as they come, with the proof still to be demonstrated at scale.", "https://cfs.energy", "Commonwealth Fusion Systems"),
  E("THE OCEAN CLEANUP", "science", 4.2, 3.3, 3.8, 4.5, "The Ocean Cleanup sets out to rid the seas of plastic, building systems that intercept waste in rivers before it reaches the ocean and harvest what is already there. The deployments are real and the cleanup figures mounting, even as critics debate the method. The ambition and the conviction are both unmistakable.", "https://theoceancleanup.com", "The Ocean Cleanup"),
  E("ØRSTED", "science", 3.8, 4.3, 2.8, 4.0, "Orsted reinvented itself from a Danish oil and gas utility into the world's largest developer of offshore wind, one of the most complete corporate pivots away from fossil fuels yet attempted. The build-out has put real clean power onto grids across the world. The transformation is proof of a genuine belief, even if the brand stays quiet outside the energy world.", "https://orsted.com", "Ørsted (company)"),
  E("CLIMEWORKS", "science", 4.2, 2.8, 3.0, 4.0, "Climeworks pulls carbon dioxide straight out of the air and turns it to stone underground, building one of the first credible direct-air-capture businesses. It is betting that removing carbon, not just emitting less, will be essential. The vision is important and the conviction clear, though the volumes captured remain small against the scale of the problem.", "https://climeworks.com", "Climeworks"),
  E("FORM ENERGY", "science", 4.0, 2.5, 2.3, 3.8, "Form Energy is solving the hardest part of renewable power, storing it for days rather than hours, with cheap iron-air batteries that could keep grids running on wind and sun. The idea is quietly pivotal to the energy transition. The technology is promising and the mission serious, but deployment is only beginning.", "https://formenergy.com", "Form Energy"),
  E("TESLA", "science", 4.3, 4.8, 4.8, 3.3, "Tesla forced the entire car industry to take electric vehicles seriously, and in doing so reshaped how the world thinks about transport and energy. The cars, batteries and charging network add up to genuine, large-scale impact. The vision and visibility are huge, though the mission now competes with the noise around its founder.", "https://www.tesla.com", "Tesla, Inc."),
  E("HELION", "science", 4.5, 2.3, 2.8, 3.5, "Helion is pursuing a distinctive path to fusion, aiming to generate electricity directly from the reaction and promising power on an aggressive timeline. The approach is bold and well-funded. As with all fusion, the impact is still theoretical, so the score rewards the size of the vision over what has been delivered.", "https://www.helionenergy.com", "Helion Energy"),
  E("INTERFACE", "science", 3.5, 3.3, 2.0, 4.3, "Interface turned a carpet-tile manufacturer into a sustainability pioneer, setting a Mission Zero goal decades ago and proving an industrial business could chase zero environmental harm. It quietly rewrote what corporate responsibility could mean. The conviction is deep and the impact real within its sector, even if few outside it know the name.", "https://www.interface.com", "Interface, Inc."),
  E("ECOSIA", "science", 3.3, 3.0, 2.8, 4.5, "Ecosia is a search engine that spends its profits planting trees, a simple reframing of an everyday tool into an instrument for reforestation. It has funded tens of millions of trees and runs as a purpose-locked non-profit. The vision is modest in scope but the belief is total, with the model built so the mission cannot be sold off.", "https://www.ecosia.org", "Ecosia"),
  E("CERN", "science", 4.5, 4.5, 3.8, 4.5, "CERN runs the largest physics experiment ever built to ask what the universe is made of, and along the way it gave the world the web. Its discoveries, the Higgs boson among them, are landmarks of human knowledge. The vision is fundamental, the impact spills far beyond physics, and the collaborative ideal behind it endures.", "https://home.cern", "CERN"),
  E("LONG NOW FOUNDATION", "science", 5.0, 2.5, 3.0, 5.0, "The Long Now Foundation exists to stretch our sense of time, fostering long-term thinking through projects like a clock designed to run for ten thousand years. It is less an organisation than a provocation about our responsibility to the deep future. The impact is measured in ideas rather than scale, but the vision and the conviction behind it are unmatched.", "https://longnow.org", "Long Now Foundation"),
  E("ITER", "science", 4.3, 2.8, 3.0, 3.8, "ITER is the largest fusion experiment on Earth, a thirty-five-nation effort to prove that a star can be bottled for power. The collaboration itself is a statement about what humanity can attempt together. The vision is vast, though the timeline stretches across decades and the payoff remains to be demonstrated.", "https://www.iter.org", "ITER"),
  E("ARC INSTITUTE", "science", 4.0, 2.5, 2.3, 4.0, "Arc Institute is reinventing how science gets done, funding scientists rather than projects and freeing them from the grant treadmill to chase hard problems in disease and biology. It is a structural bet on better research. The model is genuinely fresh and the conviction strong, though the institute is young and its results still accruing.", "https://arcinstitute.org", "Arc Institute"),
  E("ALLEN INSTITUTE", "science", 3.8, 3.5, 2.5, 4.2, "The Allen Institute does big, open team science, building atlases of the brain and the cell and giving the data away for everyone to use. It treats fundamental biology as shared infrastructure. The impact is real within research and the open ethos sincere, even if the work is largely invisible to the public.", "https://alleninstitute.org", "Allen Institute"),
  E("SANTA FE INSTITUTE", "science", 4.2, 3.0, 2.8, 4.3, "The Santa Fe Institute is the home of complexity science, studying the hidden patterns that connect economies, ecosystems, cities and minds. Its ideas have rippled across an extraordinary range of fields. The vision is intellectually expansive and the scholarly conviction deep, though its influence works through thinking rather than products.", "https://www.santafe.edu", "Santa Fe Institute"),
  E("MIT MEDIA LAB", "science", 4.0, 3.8, 3.5, 3.5, "The MIT Media Lab has spent decades inventing pieces of the future at the seam between technology, design and human life, from electronic ink to early wearables. It runs on a culture of antidisciplinary play. The track record of invention is genuine and its profile strong, even if its direction is deliberately scattered.", "https://www.media.mit.edu", "MIT Media Lab"),
  E("FRANCIS CRICK INSTITUTE", "science", 3.5, 3.5, 2.8, 3.8, "The Francis Crick Institute is Europe's largest biomedical research lab under one roof, built to let discovery science attack the biology of disease at scale. It concentrates serious talent on cancer, infection and the brain. The impact is solid and the mission clear, if quietly institutional rather than visionary.", "https://www.crick.ac.uk", "Francis Crick Institute"),
  E("MAX PLANCK SOCIETY", "science", 3.8, 4.3, 3.0, 4.2, "The Max Planck Society is Germany's engine of basic research, a network of institutes that has produced a remarkable run of Nobel laureates across the sciences. It backs curiosity-driven enquiry for its own sake. The cumulative impact on knowledge is large and the commitment to fundamental science unwavering.", "https://www.mpg.de", "Max Planck Society"),
  E("BROAD INSTITUTE", "science", 3.8, 4.0, 2.8, 4.0, "The Broad Institute sits at the centre of the genomic revolution, advancing the tools to read and edit DNA and sharing them widely with the research world. Its work underpins much of modern genetics. The impact is substantial and the open, collaborative ethos genuine, though the name means little beyond the lab.", "https://www.broadinstitute.org", "Broad Institute"),
  E("ALAN TURING INSTITUTE", "science", 3.5, 2.8, 2.5, 3.5, "The Alan Turing Institute is the UK's national centre for data science and AI, set up to turn research into real-world benefit across health, security and the economy. The intent is sound and the talent considerable. Its impact is still building and its profile largely confined to the field.", "https://www.turing.ac.uk", "Alan Turing Institute"),
  E("SETI INSTITUTE", "science", 4.0, 2.3, 3.0, 4.0, "The SETI Institute asks one of the largest questions there is, whether we are alone, scanning the skies for signs of other intelligence while doing serious astrobiology along the way. The quest captures the imagination. The vision is grand and the dedication real, though by its nature the impact is patient and unproven.", "https://www.seti.org", "SETI Institute"),
  E("ROYAL INSTITUTION", "science", 3.0, 2.8, 3.0, 4.0, "The Royal Institution has been making science public for over two centuries, from Faraday's lectures to the Christmas Lectures that still bring discovery to a wide audience. It treats public understanding as a duty. The mission is admirable and enduring, if more about heritage and communication than pushing the frontier.", "https://www.rigb.org", "Royal Institution"),
  E("PERIMETER INSTITUTE", "science", 3.8, 2.5, 2.3, 3.8, "Perimeter Institute is dedicated to the deepest questions in theoretical physics, giving brilliant minds the freedom to chase the nature of space, time and the quantum world. It is a sanctuary for fundamental thought. The vision is profound, though the rewards of such work are long-term and its audience small.", "https://perimeterinstitute.ca", "Perimeter Institute"),
  E("TATE MODERN", "culture", 3.3, 3.8, 4.3, 3.5, "Tate Modern made modern and contemporary art a mass public pleasure, drawing millions a year into a former power station and shaping taste far beyond Britain. It treats challenging work as something for everyone. The impact and the profile are large, if grounded in stewardship rather than a vision of the future.", "https://www.tate.org.uk", "Tate Modern"),
  E("TEAMLAB", "art", 4.2, 3.3, 4.0, 3.8, "teamLab dissolves the line between art, technology and nature, building vast immersive worlds of light and water that millions of people walk through and become part of. It has helped make digital art a mainstream cultural experience. The vision is expansive and the global footprint real, drawing crowds to permanent museums across continents.", "https://www.teamlab.art", "TeamLab (art collective)"),
  E("A24", "art", 4.0, 3.8, 4.5, 3.8, "A24 rewired what an independent film studio could be, backing distinctive, director-led work and building one of the most beloved brands in entertainment in the process. It proved that taste and risk could be commercially powerful. The cultural signal is enormous for its size, and its instinct for the future of storytelling keeps paying off.", "https://a24films.com", "A24"),
  E("MOMA", "culture", 3.3, 3.8, 4.5, 3.5, "The Museum of Modern Art largely wrote the story of modern art, and its collection and exhibitions still set the terms by which the field is understood. Its cultural authority is global. The impact and recognition are immense, though its role is to define and preserve rather than to push toward what comes next.", "https://www.moma.org", "Museum of Modern Art"),
  E("V&A", "culture", 3.0, 3.5, 3.8, 3.5, "The Victoria and Albert Museum is the world's leading museum of art, design and performance, a vast treasury that takes design seriously as a force in everyday life. It champions craft and creativity across centuries and cultures. The collection and reach are formidable, if institutional in character.", "https://www.vam.ac.uk", "Victoria and Albert Museum"),
  E("SERPENTINE", "culture", 3.5, 2.8, 3.3, 3.5, "The Serpentine Galleries punch far above their size, commissioning a celebrated annual architecture pavilion and pushing into art, technology and ecology at the experimental edge. They take real risks for a public institution. The vision is lively and the influence notable, though the footprint is modest.", "https://www.serpentinegalleries.org", "Serpentine Galleries"),
  E("FACTORY INTERNATIONAL", "culture", 3.8, 2.8, 3.0, 3.5, "Factory International, home of the Manchester International Festival and the Aviva Studios, commissions ambitious new work across art forms and built a major new venue to do it. It backs artists to attempt things at scale. The ambition is real and growing, with impact still concentrated in its city and festival.", "https://factoryinternational.org", "Factory International"),
  E("GLASTONBURY", "culture", 3.5, 3.5, 4.5, 4.0, "Glastonbury is the world's most famous festival, a vast temporary city that is as much a statement of values, community and causes as it is a music event. It has kept its soul at an improbable scale. The cultural signal is iconic and the ethos genuine, woven through everything from its politics to its clean-up.", "https://www.glastonburyfestivals.co.uk", "Glastonbury Festival"),
  E("PALACE", "culture", 3.0, 2.5, 3.5, 3.5, "Palace built a global skate and streetwear brand on its own terms, prizing humour, authenticity and a wilful gravitational independence from fashion's usual rules. It made not playing the game into its identity. The cultural pull is strong, if the ambition is cult influence rather than anything broader.", "https://www.palaceskateboards.com", "Palace Skateboards"),
  E("BARBICAN", "culture", 3.0, 3.0, 3.3, 3.3, "The Barbican is one of Europe's great multi-art-form centres, programming music, film, theatre and visual art inside its brutalist landmark with genuine breadth. It treats the arts as connected rather than siloed. The work is consistently strong and well known, if more curator than pioneer.", "https://www.barbican.org.uk", "Barbican Centre"),
  E("MEOW WOLF", "art", 4.0, 3.0, 3.5, 3.5, "Meow Wolf turns empty buildings into sprawling, surreal explorable art worlds, pioneering immersive experience as a new artistic medium and a viable creative business. It gives hundreds of artists a stage at architectural scale. The vision is genuinely original, with a growing footprint though still concentrated in a handful of cities.", "https://meowwolf.com", "Meow Wolf"),
  E("REFIK ANADOL", "art", 4.3, 2.8, 3.8, 3.5, "Refik Anadol paints with data and AI, turning the memories of machines into vast, hypnotic projections that have made him one of the defining artists of the algorithmic age. His work has filled museums and landmark facades worldwide. The vision is distinctive and the visibility high, even if the body of work is that of a single studio.", "https://refikanadol.com", "Refik Anadol"),
  E("RANDOM INTERNATIONAL", "art", 3.8, 2.5, 3.0, 3.3, "Random International explore what it means to be human among machines, best known for Rain Room, an installation where you walk through falling water that never touches you. Their work probes perception and autonomy. The ideas are sharp and the signature pieces memorable, though the studio's reach is necessarily intimate.", "https://www.random-international.com", "Random International"),
  E("MARSHMALLOW LASER FEAST", "art", 4.0, 2.5, 2.8, 3.5, "Marshmallow Laser Feast use immersive technology to make us feel our connection to the natural world, building experiences that let audiences see through the eyes of a tree or a river. The intent is to expand empathy for the living planet. The vision is poetic and the craft high, with a footprint that stays within the art world.", "https://www.marshmallowlaserfeast.com", "Marshmallow Laser Feast"),
  E("SOMERSET HOUSE", "culture", 3.0, 2.8, 3.0, 3.3, "Somerset House turned a grand historic building into a home for contemporary culture and the creative industries, hosting everything from exhibitions to a community of working studios. It blends heritage with a living creative scene. The role is valuable and visible, if rooted in stewardship.", "https://www.somersethouse.org.uk", "Somerset House"),
  E("BOILER ROOM", "culture", 3.8, 3.0, 3.8, 3.8, "Boiler Room democratised club culture, broadcasting raw, intimate DJ sets to the world and giving underground scenes a global stage they never had before. It changed how dance music travels. The vision was genuinely new and the cultural reach wide, with the underground ethos largely intact.", "https://boilerroom.tv", "Boiler Room (collective)"),
  E("WARP RECORDS", "culture", 3.8, 3.0, 3.3, 3.8, "Warp Records shaped the sound of electronic music for decades, backing visionary, difficult artists and proving an independent label could define a genre rather than chase it. Its catalogue is a canon. The influence on music culture is deep and the artistic conviction real, if its reach is that of a respected independent.", "https://warp.net", "Warp (record label)"),
  E("NINJA TUNE", "culture", 3.5, 2.8, 3.0, 3.5, "Ninja Tune is one of the most enduring independent labels in the world, championing adventurous music across genres for over three decades with an artist-friendly ethos. It has launched a remarkable run of careers. The taste and longevity are real, with a profile that lives among those who follow the music closely.", "https://ninjatune.net", "Ninja Tune"),
  E("NTS RADIO", "culture", 3.8, 2.8, 3.3, 4.0, "NTS Radio rebuilt radio as a global community, broadcasting an extraordinary breadth of music and voices from cities around the world, free and without the usual commercial pressures. It treats curation as culture. The vision is fresh and the conviction strong, with growing reach among the musically curious.", "https://www.nts.live", "NTS Radio"),
  E("BANDCAMP", "culture", 3.8, 3.0, 3.0, 4.3, "Bandcamp built the fairest deal in digital music, letting artists sell directly to fans and keep most of the money, a pointed alternative to streaming's pennies. Its Bandcamp Fridays put real income into musicians' hands. The mission is artist-first and the belief genuine, though recent ownership turmoil has tested it.", "https://bandcamp.com", "Bandcamp"),
  E("APPLE", "art", 4.0, 5.0, 5.0, 3.0, "Apple turned computing into something intimate and beautiful, and through the iPhone reshaped daily life for billions in a way few companies in history can claim. Design is its first language. The impact and the brand are about as large as they get, even if the underlying engine is commercial rather than missionary.", "https://www.apple.com", "Apple Inc."),
  E("TEENAGE ENGINEERING", "art", 4.0, 2.8, 3.3, 3.8, "Teenage Engineering makes objects that treat instruments and gadgets as art, from pocket synthesisers to playful modular devices with a devoted following. It proves that joy and rigour can share a circuit board. The vision is singular and the cult strong, with influence that far exceeds its modest production runs.", "https://teenage.engineering", "Teenage Engineering"),
  E("IKEA", "art", 3.3, 4.5, 4.5, 3.0, "IKEA democratised good design, putting considered, affordable furniture into homes across the planet and quietly shaping how a large share of the world lives. The flat-pack logistics alone reordered an industry. The reach and recognition are vast, though its sustainability ambitions sit alongside a model built on volume.", "https://www.ikea.com", "IKEA"),
  E("ABLETON", "art", 3.5, 3.5, 3.0, 3.8, "Ableton built the software and instruments that a generation of musicians now think with, making Live a creative standard in studios and on stages worldwide. It changed how electronic music is made and performed. The impact on music culture is real and the company's craft-led ethos genuine.", "https://www.ableton.com", "Ableton"),
  E("IDEO", "art", 3.5, 3.5, 3.0, 3.0, "IDEO popularised design thinking, the idea that the methods of designers could be turned on almost any problem, from products to public services. For a time it shaped how the corporate world approached innovation. The influence is real and widely felt, even as the method has since become commonplace.", "https://www.ideo.com", "IDEO"),
  E("MUJI", "art", 3.5, 3.5, 3.8, 3.5, "Muji built a global brand on the radical idea of no brand, stripping products back to honest, quiet essentials and selling a whole philosophy of restraint. It made simplicity desirable. The aesthetic influence is broad and the recognition strong, with a coherence most retailers never achieve.", "https://www.muji.com", "Muji"),
  E("PENTAGRAM", "art", 3.0, 3.3, 3.0, 3.0, "Pentagram is the most storied design studio in the world, a partnership of independent designers behind a long roll of identities and objects woven into everyday life. Its craft sets a standard. The work is consistently excellent and widely seen, if rooted in service rather than a vision of its own future.", "https://www.pentagram.com", "Pentagram (design firm)"),
  E("NOTHING", "art", 3.8, 2.5, 3.3, 3.3, "Nothing set out to make technology fun again, building transparent, distinctive phones and earbuds to challenge the grey sameness of the consumer-tech giants. It has carved out a real identity at speed. The vision is refreshing and the brand sharp, though it remains a young challenger with everything to prove on impact.", "https://nothing.tech", "Nothing (company)"),
  E("FRAMEWORK", "science", 3.8, 2.8, 2.5, 4.3, "Framework builds laptops you can actually repair and upgrade, a direct rebuke to a disposable electronics industry and a bet that people want to own things that last. The product genuinely walks the talk. The impact is modest in volume but the conviction is total, and it has nudged the wider industry on repairability.", "https://frame.work", "Framework Computer"),
  E("IONQ", "science", 4.0, 2.3, 2.5, 3.2, "IonQ is building quantum computers from trapped ions, chasing machines that could one day solve problems no classical computer can touch. It is among the more credible names in a field thick with hype. The vision is large, but practical impact remains over the horizon and the company is still proving its case.", "https://ionq.com", "IonQ"),
  E("FAIRPHONE", "science", 3.5, 2.5, 2.5, 4.5, "Fairphone makes the most ethical smartphone it can, with fair-trade materials, fair labour and a design built to be repaired and kept for years. It exists to shame the rest of the industry into doing better. The scale is small but the belief is uncompromising, and its influence on the conversation outweighs the sales.", "https://www.fairphone.com", "Fairphone"),
  E("SIGNAL", "science", 3.8, 3.8, 3.3, 5.0, "Signal offers genuinely private messaging to anyone, run as a non-profit with no ads, no tracking and no profit motive, in a world that monetises every other conversation. Its encryption has become a quiet standard. The mission is pure and the conviction absolute, with real reach among those who care about privacy.", "https://signal.org", "Signal (software)"),
  E("WIKIPEDIA", "culture", 4.0, 5.0, 4.5, 5.0, "Wikipedia gave the world a free encyclopedia written by everyone, and in doing so changed how billions of people find and check what they know. It runs as a non-profit on an ideal that should not have worked and did. The impact is civilisational, the reach near-universal, and the commitment to free knowledge absolute.", "https://www.wikipedia.org", "Wikipedia"),
  E("RASPBERRY PI", "culture", 3.8, 3.5, 3.3, 4.3, "Raspberry Pi put a real computer into the world for the price of a few coffees, built to get children and tinkerers coding and now powering projects of every kind. It made computing accessible by design. The impact on learning and making is real and the educational mission sincere.", "https://www.raspberrypi.org", "Raspberry Pi Foundation"),
  E("EDEN PROJECT", "culture", 3.8, 3.0, 3.3, 4.0, "The Eden Project turned an exhausted Cornish clay pit into a living theatre of plants and ecology, drawing millions to think about our relationship with the natural world. It makes environmental ideas tangible and joyful. The vision is ambitious and the conviction clear, anchored in a single remarkable place.", "https://www.edenproject.com", "Eden Project"),
  E("BREAKTHROUGH ENERGY", "science", 4.0, 3.3, 3.0, 4.2, "Breakthrough Energy, founded by Bill Gates, funds and accelerates the technologies the world needs to reach zero emissions, backing the hard, unglamorous bets that markets alone will not. It works across investment, policy and deployment. The vision is serious and the commitment substantial, with impact that compounds through the companies it supports.", "https://www.breakthroughenergy.org", "Breakthrough Energy"),
  E("SNØHETTA", "art", 4.3, 3.0, 3.0, 4.0, "Snohetta designs buildings and places that give something back, from the Oslo Opera House you can walk up to a series of energy-positive structures that produce more power than they use. It treats architecture as a social and environmental act. The vision is generous and the conviction evident in the work.", "https://www.snohetta.com", "Snøhetta"),
  E("BJARKE INGELS GROUP", "art", 4.3, 3.3, 3.8, 3.5, "Bjarke Ingels Group makes optimism buildable, designing playful, ambitious architecture like a power plant you can ski down, and sketching plans for a sustainably redesigned planet. It insists the future can be both responsible and joyful. The vision is bold and the profile high, with a growing body of completed work.", "https://big.dk", "Bjarke Ingels Group"),
  E("STUDIO ROOSEGAARDE", "art", 5.0, 2.8, 3.0, 4.5, "Studio Roosegaarde is Solarpunk made real, building dreamlike works that merge technology and nature, from towers that scrub smog from the air to landscapes that glow without electricity. It is a working argument that the future can be beautiful and clean at once. The vision is unmatched in the index, even if the projects are singular interventions.", "https://www.studioroosegaarde.net", "Daan Roosegaarde"),
  E("STONE ISLAND", "art", 3.3, 2.8, 3.3, 3.5, "Stone Island built a cult on material innovation, pioneering garment dyeing and experimental fabrics and keeping an archive of hundreds of textiles few brands could imagine. It treats clothing as applied research. The influence runs deep in design and menswear, though the ambition is craft rather than world-changing.", "https://www.stoneisland.com", "Stone Island"),
  E("NEXUS STUDIOS", "art", 3.5, 2.8, 2.8, 3.2, "Nexus Studios works at the frontier of film, animation and immersive technology, making award-winning work and inventive experiences for the likes of Apple, Google and Nike. It bridges art and emerging tech for a brand audience. The craft is high, with a footprint that lives mostly within the industry.", "https://nexusstudios.com", "Nexus Studios"),
  E("ROLAND", "art", 3.3, 4.0, 3.3, 3.3, "Roland built the machines that invented modern music, its 808 and 303 defining the sound of hip-hop, techno and house for half a century. Few instruments have shaped culture so deeply. The impact on music is genuinely large, even if the company today is a maker of fine instruments rather than a visionary force.", "https://www.roland.com", "Roland Corporation"),
  E("UNITED VISUAL ARTISTS", "art", 3.8, 2.5, 2.8, 3.3, "United Visual Artists create large-scale light sculptures and installations that explore perception, time and the natural world, work that sits between art, architecture and technology. The studio has a distinctive language of its own. The vision is considered and the craft high, with a reach that stays within the art and design world.", "https://uva.co.uk", "United Visual Artists"),
  E("RYOJI IKEDA", "art", 4.3, 2.5, 3.0, 3.8, "Ryoji Ikeda turns mathematics into overwhelming sensory experience, building installations from pure data, light and sound that make the sublime feel like something you can stand inside. He is a singular figure in media art. The vision is profound and the work uncompromising, if necessarily addressed to a particular audience.", "https://www.ryoji-ikeda.com", "Ryoji Ikeda"),
  E("SUPERBLUE", "art", 3.5, 2.3, 2.5, 3.0, "Superblue is building a business around experiential art, creating large-format spaces where audiences step inside the work of leading artists rather than viewing it on a wall. It is a bet on a new model for how art reaches people. The idea is forward-looking, though the venture is young and its impact still small.", "https://www.superblue.com", "Superblue"),
  E("NAOSHIMA", "art", 4.0, 2.8, 3.3, 4.0, "Naoshima reimagined a fading Japanese island as a place where art, architecture and landscape become one, drawing pilgrims to Tadao Ando museums and works set into the land and sea. It is a quiet masterpiece of cultural regeneration. The vision is beautiful and the conviction long-term, if rooted in a single place.", "https://benesse-artsite.jp", "Naoshima"),
  E("SÓNAR", "culture", 3.5, 2.8, 3.3, 3.5, "Sonar pairs club culture with a serious congress on art, science and technology, treating electronic music and the future as parts of the same conversation. It has shaped how the two worlds meet. The vision is distinctive and the reach international, if focused on a particular community.", "https://sonar.es", "Sónar"),
  E("MUTEK", "culture", 3.3, 2.5, 2.5, 3.5, "MUTEK is a festival devoted to electronic music and digital creativity, spreading from Montreal to a network of editions across continents. It champions the experimental edge. The curation is respected and the spread genuine, though its profile sits within the field rather than beyond it.", "https://mutek.org", "Mutek"),
  E("NXT MUSEUM", "culture", 3.3, 2.0, 2.3, 3.0, "Nxt Museum is the Netherlands' first museum dedicated to new media art, presenting large-scale digital and sensory installations to a public still discovering the form. It is an early bet on where art is heading. The intent is forward-looking, though the museum is young and its impact still small.", "https://nxtmuseum.com", "Nxt Museum"),
  E("DESIGN MUSEUM", "culture", 3.0, 2.8, 3.0, 3.3, "The Design Museum gives design its own stage, championing architecture and contemporary design through exhibitions and its annual awards. It argues for design as something worth public attention. The role is valuable and the programme respected, if more curatorial than pioneering.", "https://designmuseum.org", "Design Museum"),
  E("180 STUDIOS", "culture", 3.3, 2.3, 2.8, 2.8, "180 Studios stages ambitious digital art and design shows in a brutalist building on the Strand, drawing crowds to immersive work that blurs music, light and technology. It has become a notable venue for the form. The programming is sharp, though the operation is young and its impact still local.", "https://180studios.com", "180 The Strand"),
  E("ZKM", "culture", 3.5, 2.8, 2.5, 3.5, "ZKM in Karlsruhe is a rare hybrid of museum and research institution, working at the meeting point of art, science and digital technology for over three decades. It takes media art seriously as a field of enquiry. The vision is thoughtful and the archive significant, with a reach that stays largely within that world.", "https://zkm.de", "ZKM Center for Art and Media"),
  E("SNOW PEAK", "art", 3.3, 2.5, 2.8, 3.5, "Snow Peak makes outdoor gear as an act of craftsmanship, designing beautiful, durable equipment around a philosophy of reconnecting people with nature and each other. It treats the campsite as a design canvas. The aesthetic is coherent and the values sincere, though the ambition is a fine product rather than a movement.", "https://www.snowpeak.com", "Snow Peak"),
  E("AEON", "culture", 4.0, 2.8, 3.0, 4.3, "Aeon publishes some of the most thoughtful writing and film on the internet, treating big ideas in science, philosophy and the human condition with a rigour and beauty the attention economy rarely allows. It is a quiet argument for depth. The vision is admirable and the conviction clear, with influence that outweighs its size.", "https://aeon.co", "Aeon (magazine)"),
];

const linkFor = (e) => e.url || `https://en.wikipedia.org/wiki/${encodeURIComponent(e.wiki.replace(/ /g, "_"))}`;
const isWikiLink = (e) => !e.url;

const score = (e) => DIMENSIONS.reduce((t, d) => t + e[d.key] * d.weight, 0);
const tierOf = (s) => TIERS.find((t) => s >= t.min) || TIERS[TIERS.length - 1];
const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);

const RANKED_ALL = ENTRIES.map((e) => ({ ...e, score: score(e) })).sort((a, b) => b.score - a.score);

/* Spread a list so the same sector rarely sits next to itself. Greedy: at each
   step pick the highest-ranked remaining entry whose sector differs from the
   previous one or two placed, and from the entry one row up, falling back to
   best-available when every remaining option clashes. */
function spreadBySector(list, rowShift) {
  const pool = list.slice();
  const result = [];
  const recentlyBad = (sector, idx) => {
    const prev = result[idx - 1];
    const prev2 = result[idx - 2];
    const up = idx - rowShift >= 0 ? result[idx - rowShift] : null;
    return (
      (prev && prev.sector === sector) ||
      (prev2 && prev2.sector === sector) ||
      (up && up.sector === sector)
    );
  };
  while (pool.length) {
    const idx = result.length;
    let pick = pool.findIndex((e) => !recentlyBad(e.sector, idx));
    if (pick === -1) {
      const prev = result[idx - 1];
      pick = pool.findIndex((e) => !prev || e.sector !== prev.sector);
      if (pick === -1) pick = 0;
    }
    result.push(pool.splice(pick, 1)[0]);
  }
  return result;
}

const mod = (n, m) => ((n % m) + m) % m;

const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

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

const arcPath = (cx, cy, r, a0, a1) => {
  const [sx, sy] = polar(cx, cy, r, a1);
  const [ex, ey] = polar(cx, cy, r, a0);
  const large = a1 - a0 <= 180 ? 0 : 1;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
};

const Sigil = memo(function Sigil({ entry, size = 88, animate = false, needleColor }) {
  const radii = [16, 22, 28, 34, 40];
  const start = -150;
  const needleA = start + (entry.score / 5) * 300;
  const [nx, ny] = polar(50, 50, 44, needleA);
  const tip = polar(50, 50, 47, needleA);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className={animate ? "pf-sigil pf-sigil-anim" : "pf-sigil"}>
      {DIMENSIONS.map((d, idx) => {
        const sweep = Math.max(4, (entry[d.key] / 5) * 300);
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
                      transform: barsOn ? `scaleX(${entry[d.key] / 5})` : "scaleX(0)",
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
              <span className="pf-method-w">{t.min > 0 ? `${t.min.toFixed(1)}+` : `< 2.9`}</span>
              <span className="pf-method-desc">{t.desc}</span>
            </div>
          ))}
        </div>

        <p className="pf-body pf-dim-note">
          Descriptions are drawn from each entry's public record. Imagery is curated by Deep Time; entries awaiting an
          image show their sigil, a glyph drawn from their five scores.
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
    if (filter !== "all") return list.filter((e) => e.sector === filter);
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
