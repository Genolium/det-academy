// Academic passages for the interactive reading bank and the C-Test bank.
//
// Each passage is original prose written for this project. The generator derives
// several tasks from one passage: a different gap word, a different highlight
// sentence and a different set of C-Test blanks. That keeps the pool large
// without shipping near-duplicate texts.

export const readingPassages = [
  {
    title: 'The Economics of Urban Trees',
    text:
      'City trees are often treated as decoration, yet they perform measurable engineering work. A mature canopy intercepts rainfall before it reaches the pavement, which reduces the volume of water that storm drains must carry during heavy storms. Leaves also release water vapour, cooling the air around a street by several degrees and lowering the electricity demand of nearby buildings. Property values rise where trees line the pavement, and shops report more foot traffic on shaded blocks. The benefits are not automatic: young trees need years of watering and protection before they provide them. Municipal budgets that plant saplings but ignore maintenance therefore pay twice, once for the tree and again for its replacement.',
    gaps: ['intercepts', 'vapour', 'maintenance'],
    highlights: [
      'Leaves also release water vapour, cooling the air around a street by several degrees and lowering the electricity demand of nearby buildings.',
      'A mature canopy intercepts rainfall before it reaches the pavement, which reduces the volume of water that storm drains must carry during heavy storms.',
    ],
    titles: ['The Economics of Urban Trees', 'A History of Municipal Parks', 'How to Prune Fruit Trees', 'Why Cities Ban Street Planting'],
    mainIdeas: [
      'Urban trees deliver measurable services that justify long-term maintenance spending.',
      'Trees are decorative and should be removed from dense neighbourhoods.',
      'Street trees are only useful in rural areas with abundant rainfall.',
      'Cities should plant saplings without any maintenance budget.',
    ],
  },
  {
    title: 'Sleep and Memory Consolidation',
    text:
      'For decades, sleep was described as a passive state in which the brain simply rested. Modern recordings of neural activity tell a different story. During deep sleep, the hippocampus replays sequences of the day in compressed bursts, while the cortex gradually incorporates those patterns into longer-term storage. Students who sleep after studying a list of words recall more of it the next morning than those who stay awake for the same interval, even when total study time is identical. The effect is selective: emotionally charged material and skills practised the previous day benefit most. This does not mean that sleep can replace study, only that the consolidation it performs cannot be bought with extra waking hours.',
    gaps: ['incorporates', 'consolidation', 'selective'],
    highlights: [
      'During deep sleep, the hippocampus replays sequences of the day in compressed bursts, while the cortex gradually incorporates those patterns into longer-term storage.',
      'The effect is selective: emotionally charged material and skills practised the previous day benefit most.',
    ],
    titles: ['Sleep and Memory Consolidation', 'The History of Dream Interpretation', 'Why Adolescents Need Later School Days', 'How to Memorise Lists in One Hour'],
    mainIdeas: [
      'Sleep actively consolidates memory, but it cannot substitute for studying.',
      'Sleep is a passive state with no effect on learning.',
      'Students should replace revision with additional sleep.',
      'Only emotional memories survive a night of sleep.',
    ],
  },
  {
    title: 'The Slow Spread of Paper Money',
    text:
      'Paper currency did not arrive as a sudden invention. In medieval China, merchants began issuing receipts for metal coins they had deposited with trusted warehouses. Because the receipts were lighter than the coins, they circulated as payment, and the warehouses gradually became banks. The state eventually recognised the convenience and issued its own notes, but early experiments collapsed when rulers printed more paper than they could redeem in metal. Europe adopted similar instruments centuries later through bills of exchange used by traders. The pattern repeated: private credit came first, public currency followed, and inflation punished the issuers who ignored the difference between a promise and a reserve.',
    gaps: ['circulated', 'redeem', 'inflation'],
    highlights: [
      'Because the receipts were lighter than the coins, they circulated as payment, and the warehouses gradually became banks.',
      'The pattern repeated: private credit came first, public currency followed, and inflation punished the issuers who ignored the difference between a promise and a reserve.',
    ],
    titles: ['The Slow Spread of Paper Money', 'A Catalogue of Ancient Coins', 'How Central Banks Set Interest Rates', 'The End of Metal Currency'],
    mainIdeas: [
      'Paper money emerged from private credit practices and failed when issuance outran reserves.',
      'Paper money was invented by a single European monarch.',
      'Metal coins disappeared immediately after the first banknote.',
      'Inflation has no relationship to the supply of paper notes.',
    ],
  },
  {
    title: 'Antibiotic Resistance in Hospitals',
    text:
      'Every course of antibiotics creates selection pressure. Bacteria that survive treatment reproduce, and their descendants inherit the mechanisms that protected them. Hospitals concentrate this process because they bring together patients with weakened immune systems, invasive devices and frequent prescriptions. A ward that prescribes broad-spectrum drugs for minor infections may see resistant strains spread along the same corridors. Surveillance matters more than any single prescription: laboratories must identify the organism, clinicians must narrow the drug once results arrive, and staff must wash their hands between patients. None of these steps is dramatic, which is precisely why they are easy to neglect. Resistance is not a future problem; it is the cumulative result of present habits.',
    gaps: ['surveillance', 'invasive', 'cumulative'],
    highlights: [
      'Hospitals concentrate this process because they bring together patients with weakened immune systems, invasive devices and frequent prescriptions.',
      'Resistance is not a future problem; it is the cumulative result of present habits.',
    ],
    titles: ['Antibiotic Resistance in Hospitals', 'The Discovery of Penicillin', 'How Viruses Replicate', 'A Guide to Hospital Architecture'],
    mainIdeas: [
      'Resistance grows from routine prescribing and hygiene habits, so ordinary discipline matters most.',
      'Resistance is caused only by patients who stop treatment early.',
      'Broad-spectrum antibiotics should be used for every minor infection.',
      'Hospital design has no influence on the spread of bacteria.',
    ],
  },
  {
    title: 'Why Cities Sink: Groundwater Extraction',
    text:
      'Several coastal megacities are sinking faster than the sea is rising. The cause is often groundwater: as aquifers are pumped for drinking water and irrigation, the porous layers beneath the city compact and the surface subsides. Jakarta has dropped by metres in some districts, and Mexico City continues to settle as its aquifer is depleted. The process is almost invisible until pavements crack, pipes break and seawater enters the drainage system. Once the aquifer is compressed, it cannot store water again, so the damage is effectively permanent. Engineers can slow the decline by recharging aquifers and restricting new wells, but the political difficulty is that the water is being used by people who have no alternative.',
    gaps: ['compact', 'aquifer', 'subsides'],
    highlights: [
      'Once the aquifer is compressed, it cannot store water again, so the damage is effectively permanent.',
      'The process is almost invisible until pavements crack, pipes break and seawater enters the drainage system.',
    ],
    titles: ['Why Cities Sink: Groundwater Extraction', 'The Geology of Mountain Ranges', 'How Desalination Plants Work', 'Coastal Tourism and Beach Resorts'],
    mainIdeas: [
      'Groundwater extraction causes permanent subsidence that is hard to reverse or regulate.',
      'Cities sink only because of tectonic plate movement.',
      'Aquifers refill automatically after compaction.',
      'Seawater intrusion is unrelated to groundwater pumping.',
    ],
  },
  {
    title: 'The Mathematics of Voting Systems',
    text:
      'A voting system is a machine for turning preferences into a single outcome, and every machine has quirks. Under first-past-the-post, a candidate can win with a small share of the vote when the opposition is divided. Ranked-choice voting avoids that problem but can eliminate a broadly acceptable candidate early. Arrow\u2019s theorem proves that no ranked system can satisfy a short list of reasonable fairness conditions at once. The practical lesson is not that elections are meaningless, but that the choice of rule shapes the result before any ballot is cast. Designers therefore debate thresholds, district sizes and transfer rules with the same seriousness that candidates debate policy, because the rules determine which coalitions can win.',
    gaps: ['eliminate', 'thresholds', 'coalitions'],
    highlights: [
      'Arrow\u2019s theorem proves that no ranked system can satisfy a short list of reasonable fairness conditions at once.',
      'The practical lesson is not that elections are meaningless, but that the choice of rule shapes the result before any ballot is cast.',
    ],
    titles: ['The Mathematics of Voting Systems', 'A History of Secret Ballots', 'How Parliaments Draft Legislation', 'Campaign Finance Explained'],
    mainIdeas: [
      'Electoral rules systematically shape outcomes, so their design is a substantive political choice.',
      'All voting systems produce identical results.',
      'Arrow\u2019s theorem proves that voting should be abolished.',
      'District size has no effect on representation.',
    ],
  },
  {
    title: 'Volcanic Ash and Air Travel',
    text:
      'Volcanic ash is not ordinary dust. Its particles are glassy, abrasive and melt at temperatures reached inside a jet engine, where they can coat turbine blades and stall a compressor. The 2010 eruption in Iceland demonstrated how far the hazard travels: ash drifted across Europe and grounded thousands of flights even though the volcano itself was small by geological standards. Regulators responded with concentration thresholds, allowing aircraft to fly through dilute plumes that were previously avoided entirely. Airlines now combine satellite imagery with engine-wear models to decide where the boundary lies. The result is a compromise between safety and economic cost, revised whenever new evidence arrives.',
    gaps: ['abrasive', 'thresholds', 'dilute'],
    highlights: [
      'Its particles are glassy, abrasive and melt at temperatures reached inside a jet engine, where they can coat turbine blades and stall a compressor.',
      'The result is a compromise between safety and economic cost, revised whenever new evidence arrives.',
    ],
    titles: ['Volcanic Ash and Air Travel', 'The Geology of Ocean Trenches', 'How Jet Engines Are Manufactured', 'Weather Forecasting for Sailors'],
    mainIdeas: [
      'Ash policy balances engine risk against disruption and is continually revised.',
      'Volcanic ash is harmless to modern aircraft.',
      'The 2010 eruption was the largest in recorded history.',
      'Satellite imagery cannot detect ash clouds.',
    ],
  },
  {
    title: 'The Return of Beavers to River Valleys',
    text:
      'Beavers were hunted to near extinction in Europe, and their absence changed the shape of rivers. Without dams, streams ran faster and cut deeper channels, carrying sediment downstream and worsening floods. Reintroduction projects have produced a different landscape: ponds slow the water, raise the water table and create wetlands that hold carbon. Fish and amphibians return, and downstream towns receive less peak flow during storms. Farmers sometimes object when fields become wet, and roads can be flooded by an ambitious colony. Compensation schemes and carefully placed devices that regulate pond height have reduced the conflict. The beaver is therefore less a romantic symbol than a cheap piece of water infrastructure.',
    gaps: ['sediment', 'reintroduction', 'compensation'],
    highlights: [
      'Without dams, streams ran faster and cut deeper channels, carrying sediment downstream and worsening floods.',
      'The beaver is therefore less a romantic symbol than a cheap piece of water infrastructure.',
    ],
    titles: ['The Return of Beavers to River Valleys', 'How Dams Generate Electricity', 'A Field Guide to European Fish', 'The History of Fur Trading'],
    mainIdeas: [
      'Beaver dams restore wetland hydrology and can reduce flood peaks at low cost.',
      'Beavers should be excluded from all agricultural land.',
      'Reintroduction has no measurable effect on rivers.',
      'Beaver dams increase downstream flooding in every case.',
    ],
  },
  {
    title: 'Language Loss and Documentation',
    text:
      'A language disappears when parents stop speaking it to their children, not when the last fluent elder dies. The distinction matters for policy. Recording a dictionary preserves vocabulary but does not create new speakers; only daily use in homes, schools and workplaces does. Documentation projects therefore increasingly combine audio archives with community classes and radio programmes. Linguists debate how much grammar must be written down before a language is considered safe, but speakers rarely frame the question that way. For them the priority is whether the language can still be used to raise children, tell jokes and conduct business. A grammar in a university library is a record of loss as often as it is a tool of survival.',
    gaps: ['fluent', 'documentation', 'priority'],
    highlights: [
      'A language disappears when parents stop speaking it to their children, not when the last fluent elder dies.',
      'A grammar in a university library is a record of loss as often as it is a tool of survival.',
    ],
    titles: ['Language Loss and Documentation', 'The Origins of Indo-European Languages', 'How Children Acquire Grammar', 'Translation in International Courts'],
    mainIdeas: [
      'Language survival depends on everyday intergenerational use, not only on archived records.',
      'A complete dictionary guarantees that a language will survive.',
      'Languages disappear only when their last speaker dies.',
      'Community classes are less useful than printed grammars.',
    ],
  },
  {
    title: 'The Physics of Cycling Stability',
    text:
      'A moving bicycle stays upright for reasons that engineers still argue about. Gyroscopic effects from the spinning wheels help, but experiments with counter-rotating wheels show that a bicycle can remain stable without them. The geometry of the steering axis matters: when the frame leans, the front wheel turns into the fall, and the resulting curve brings the bicycle back under its centre of mass. Riders also contribute, making small corrections that are too fast to see. Designers exploit these effects when they tune a frame for cargo or for racing. The humble bicycle is therefore a useful reminder that stability is often a property of a system rather than of a single part.',
    gaps: ['gyroscopic', 'geometry', 'stability'],
    highlights: [
      'The geometry of the steering axis matters: when the frame leans, the front wheel turns into the fall, and the resulting curve brings the bicycle back under its centre of mass.',
      'The humble bicycle is therefore a useful reminder that stability is often a property of a system rather than of a single part.',
    ],
    titles: ['The Physics of Cycling Stability', 'The History of the Penny Farthing', 'How Tyres Are Manufactured', 'Urban Cycling Infrastructure'],
    mainIdeas: [
      'Bicycle stability emerges from frame geometry, wheel motion and rider corrections together.',
      'Gyroscopic wheels are the only reason a bicycle stays upright.',
      'Riders play no role in balancing a moving bicycle.',
      'Cargo bicycles are inherently unstable at any speed.',
    ],
  },
  {
    title: 'Microplastics in the Deep Ocean',
    text:
      'Most plastic that enters the sea does not float in a visible patch. Sunlight and waves break it into fragments, and dense particles sink. Surveys of deep-sea sediment now find microplastics in trenches thousands of metres below the surface, carried there by currents and by animals that ingest them. The concentration is highest near coastal cities and shipping lanes, but even remote basins contain fibres from clothing. The ecological consequences are difficult to measure because the particles vary in size, chemistry and the pollutants they carry. What is clear is that the deep ocean is not a separate world: it is the final reservoir for material produced on land, and it retains that material for a very long time.',
    gaps: ['fragments', 'sediment', 'reservoir'],
    highlights: [
      'Surveys of deep-sea sediment now find microplastics in trenches thousands of metres below the surface, carried there by currents and by animals that ingest them.',
      'What is clear is that the deep ocean is not a separate world: it is the final reservoir for material produced on land, and it retains that material for a very long time.',
    ],
    titles: ['Microplastics in the Deep Ocean', 'The Biology of Coral Polyps', 'How Ocean Currents Affect Climate', 'Recycling Policy in Coastal Cities'],
    mainIdeas: [
      'Microplastics reach the deep sea and persist there, linking land pollution to remote ecosystems.',
      'Plastic pollution is confined to the ocean surface.',
      'Deep-sea trenches are free of human-made particles.',
      'Microplastics decompose quickly in cold water.',
    ],
  },
  {
    title: 'Theatre and Civic Life in Athens',
    text:
      'Athenian drama was funded by the state and attended by thousands of citizens, yet it was not simply entertainment. Tragedies staged arguments about justice, kinship and the limits of power in front of an audience that would later vote on war and taxation. Comedies mocked politicians by name while the city was at war. The theatre therefore functioned as a public rehearsal of civic dilemmas, and the festival calendar gave those dilemmas a recurring date. Attendance was not universal: women, slaves and foreigners occupied an ambiguous position in the audience. Still, the scale of the event made it one of the few places where a large community could share a vocabulary for debating what a good city should do.',
    gaps: ['ambiguous', 'recurring', 'civic'],
    highlights: [
      'Tragedies staged arguments about justice, kinship and the limits of power in front of an audience that would later vote on war and taxation.',
      'Still, the scale of the event made it one of the few places where a large community could share a vocabulary for debating what a good city should do.',
    ],
    titles: ['Theatre and Civic Life in Athens', 'Roman Engineering and Aqueducts', 'The Origins of Opera', 'Greek Sculpture in the Classical Period'],
    mainIdeas: [
      'Athenian theatre was a civic institution that rehearsed political dilemmas for a mass audience.',
      'Athenian drama was performed only for the ruling elite.',
      'Comedy avoided political subjects entirely.',
      'Theatre had no connection to democratic decision-making.',
    ],
  },
  {
    title: 'Precision Agriculture and Water Use',
    text:
      'Irrigation is the largest consumer of fresh water in many countries, and most of it is applied without knowing how much the crop actually needs. Precision agriculture changes that by combining soil sensors, weather forecasts and satellite imagery. A field is divided into zones, and each zone receives water only when its measured moisture falls below a threshold. Trials in arid regions report savings of twenty to thirty percent without a loss of yield, because overwatering wastes water and can also leach nutrients below the root zone. The barrier is capital: sensors, pumps and software cost money, and small farms struggle to finance them. Subsidies that pay for pipes but not for measurement therefore miss the bottleneck.',
    gaps: ['threshold', 'leach', 'subsidies'],
    highlights: [
      'Trials in arid regions report savings of twenty to thirty percent without a loss of yield, because overwatering wastes water and can also leach nutrients below the root zone.',
      'Subsidies that pay for pipes but not for measurement therefore miss the bottleneck.',
    ],
    titles: ['Precision Agriculture and Water Use', 'The Green Revolution in Asia', 'How Fertilisers Are Produced', 'Rural Migration in the Twentieth Century'],
    mainIdeas: [
      'Measuring soil moisture saves water, but capital costs keep small farms from adopting it.',
      'Irrigation has no effect on nutrient loss.',
      'Precision agriculture always reduces crop yields.',
      'Subsidies for pipes are sufficient to modernise irrigation.',
    ],
  },
  {
    title: 'The Psychology of Waiting Queues',
    text:
      'People judge a queue by its perceived duration rather than its measured length. An empty wait feels longer than a busy one, and a wait with visible progress feels shorter than a stationary one. Airports exploit this by placing mirrors near baggage carousels and by reporting which belt will deliver a flight, even when the bags are not yet there. Fairness also matters: a queue that appears to allow jumping generates more complaints than a longer queue that advances evenly. Service designers therefore distract, inform and structure waits rather than simply shortening them. The underlying lesson is that satisfaction is shaped by expectations and by the sense of control, not only by the number of minutes spent standing still.',
    gaps: ['perceived', 'stationary', 'satisfaction'],
    highlights: [
      'People judge a queue by its perceived duration rather than its measured length.',
      'The underlying lesson is that satisfaction is shaped by expectations and by the sense of control, not only by the number of minutes spent standing still.',
    ],
    titles: ['The Psychology of Waiting Queues', 'Airport Security Since 2001', 'How Baggage Handling Works', 'The Economics of Theme Parks'],
    mainIdeas: [
      'Perceived fairness and progress shape wait satisfaction more than actual duration.',
      'Passengers only care about the physical length of a queue.',
      'Distraction makes waits feel longer in every setting.',
      'Queue design has no effect on customer complaints.',
    ],
  },
  {
    title: 'Vertical Farming\u2019s Energy Problem',
    text:
      'Vertical farms grow crops in stacked trays under artificial light, using a fraction of the land and almost no pesticides. Their advantage is greatest for leafy greens in cities, where transport distances are short and shelf life matters. The weakness is electricity. Sunlight is free, but lamps are not, and the intensity required for fruiting crops makes their energy bill prohibitive. Proponents argue that renewable tariffs and waste heat from nearby buildings can close the gap; critics note that those buildings are not always available and that batteries add further cost. The technology is therefore best understood as a specialised tool for a narrow range of crops rather than a general replacement for fields.',
    gaps: ['prohibitive', 'specialised', 'intensity'],
    highlights: [
      'Sunlight is free, but lamps are not, and the intensity required for fruiting crops makes their energy bill prohibitive.',
      'The technology is therefore best understood as a specialised tool for a narrow range of crops rather than a general replacement for fields.',
    ],
    titles: ['Vertical Farming\u2019s Energy Problem', 'The History of Greenhouse Design', 'How LED Lighting Works', 'Urban Food Markets'],
    mainIdeas: [
      'Vertical farms suit leafy greens but are limited by the cost of artificial light.',
      'Vertical farms can replace all field agriculture immediately.',
      'Artificial lighting is cheaper than sunlight for every crop.',
      'Energy costs are irrelevant to indoor farming.',
    ],
  },
  {
    title: 'How Archives Survive Fires',
    text:
      'Archives burn because paper burns, but the greater loss is often caused by water and smoke rather than flame. A fire in a library triggers sprinklers, and the books that survive the heat absorb water and develop mould within days. Conservators therefore plan for the whole sequence: detection, suppression, freezing and freeze-drying. Digitisation helps, but only for what has already been scanned, and scans rarely capture the material qualities that historians value. The most effective protection is duplication across distant sites, a practice that sounds bureaucratic until a single building is lost. Catastrophe planning is unglamorous work, and that is precisely why it is chronically underfunded.',
    gaps: ['suppression', 'duplication', 'catastrophe'],
    highlights: [
      'A fire in a library triggers sprinklers, and the books that survive the heat absorb water and develop mould within days.',
      'Catastrophe planning is unglamorous work, and that is precisely why it is chronically underfunded.',
    ],
    titles: ['How Archives Survive Fires', 'The Invention of the Printing Press', 'Modern Library Architecture', 'The History of Papermaking'],
    mainIdeas: [
      'Archive survival depends on planning for water, mould and duplication, not only on fire suppression.',
      'Sprinklers always save books without causing damage.',
      'Digitisation fully replaces the need for physical archives.',
      'Fires are the only threat to paper collections.',
    ],
  },
  {
    title: 'Roman Concrete and the Chemistry of Repair',
    text:
      'Roman concrete has survived two thousand years of wave action, yet it was not mixed to a modern recipe. Builders used volcanic ash, lime and seawater, and the sea itself helped the material cure. When seawater seeped into cracks, it dissolved minerals that then grew into crystals, sealing the gaps before they widened. Modern concrete often fails at the steel reinforcement, which rusts and expands until the surface breaks away. Engineers studying Roman harbours have begun to design repairs that rely on similar mineral growth. The lesson is not that old buildings were better, but that durability depends on how a material responds to damage rather than on how strong it is when new.',
    gaps: ['dissolved', 'reinforcement', 'durability'],
    gapDistractors: [
      ['absorbed', 'released', 'transported'],
      ['framework', 'surface', 'mixture'],
      ['strength', 'appearance', 'cost'],
    ],
    highlights: [
      'When seawater seeped into cracks, it dissolved minerals that then grew into crystals, sealing the gaps before they widened.',
      'The lesson is not that old buildings were better, but that durability depends on how a material responds to damage rather than on how strong it is when new.',
    ],
    titles: [
      'Roman Concrete and the Chemistry of Repair',
      'The Collapse of Roman Aqueducts',
      'Modern Steel Production',
      'A History of Harbour Walls',
    ],
    mainIdeas: [
      'Roman concrete endured because its chemistry allowed damage to seal itself.',
      'Roman builders used steel reinforcement to prevent cracks.',
      'Modern concrete is stronger than Roman concrete in every way.',
      'Seawater destroys all ancient concrete within decades.',
    ],
  },
  {
    title: 'Why Handwriting Still Helps Students Think',
    text:
      'Typing is faster, searchable and easier to edit, so why do some researchers still ask students to write by hand? The answer concerns effort. Forming letters forces the writer to choose words more slowly and to summarise rather than transcribe. In experiments, students who took longhand notes recalled more concepts than those who typed full lectures, even though the typists recorded more sentences. The advantage disappears when handwriting becomes a copying exercise or when the notes are never reviewed. A sensible course therefore mixes both: typing for drafts and archives, handwriting for lectures where selection matters. The tool is less important than the mental work it encourages.',
    gaps: ['transcribe', 'recalled', 'selection'],
    gapDistractors: [
      ['translate', 'delete', 'repeat'],
      ['recorded', 'ignored', 'predicted'],
      ['grammar', 'length', 'neatness'],
    ],
    highlights: [
      'Forming letters forces the writer to choose words more slowly and to summarise rather than transcribe.',
      'The tool is less important than the mental work it encourages.',
    ],
    titles: [
      'Why Handwriting Still Helps Students Think',
      'The History of the Pencil',
      'How to Type Faster',
      'The End of Lecture Notes',
    ],
    mainIdeas: [
      'Handwriting helps because it slows note-taking enough to require selection.',
      'Typing always produces better learning than handwriting.',
      'Handwriting is useful only for copying texts exactly.',
      'Students should never review their notes.',
    ],
  },
  {
    title: 'The Hidden Costs of Second-Hand Clothing',
    text:
      'The second-hand clothing trade is often described as a simple environmental win, but the accounting is more complicated. Reselling a jacket keeps it out of landfill and avoids the materials needed for a new one. Yet the jacket must be collected, sorted, cleaned and shipped, and many garments travel thousands of kilometres before they are worn again. In importing countries, cheap used clothes can undercut local tailors and flood markets with items that are hard to repair. The environmental benefit is therefore real but smaller than the headline figure suggests, and it depends on what happens at the end of the second life. A market that rewards durability would do more than one that rewards volume.',
    gaps: ['accounting', 'undercut', 'durability'],
    gapDistractors: [
      ['marketing', 'storage', 'design'],
      ['support', 'train', 'license'],
      ['novelty', 'colour', 'price'],
    ],
    highlights: [
      'The second-hand clothing trade is often described as a simple environmental win, but the accounting is more complicated.',
      'The environmental benefit is therefore real but smaller than the headline figure suggests, and it depends on what happens at the end of the second life.',
    ],
    titles: [
      'The Hidden Costs of Second-Hand Clothing',
      'How Cotton Is Grown',
      'The End of Fast Fashion',
      'A History of Tailoring',
    ],
    mainIdeas: [
      'Second-hand clothing helps, but transport and market effects reduce the gain.',
      'Reselling clothes has no environmental benefit at all.',
      'Used clothing always strengthens local tailoring industries.',
      'Durability is irrelevant to the clothing trade.',
    ],
  },
  {
    title: 'The Living Culture of Sourdough',
    text:
      'A sourdough starter is a community of wild yeasts and bacteria kept alive by regular feeding. Flour supplies starch, water activates enzymes, and the microbes produce acids as well as gas. The acids give the loaf its tang and slow the growth of mould, while the gas trapped in gluten makes the crumb rise. Temperature decides which organisms dominate: a warm starter ferments quickly and tastes mild, while a cool one develops sharper flavours over a longer period. Bakers who treat the starter as a fixed recipe often struggle, because the culture changes with the flour and the room. Successful baking depends more on watching the dough than on following exact timings.',
    gaps: ['dominate', 'ferments', 'culture'],
    gapDistractors: [
      ['arrive', 'escape', 'divide'],
      ['dries', 'freezes', 'burns'],
      ['recipe', 'oven', 'flour'],
    ],
    highlights: [
      'The acids give the loaf its tang and slow the growth of mould, while the gas trapped in gluten makes the crumb rise.',
      'Successful baking depends more on watching the dough than on following exact timings.',
    ],
    titles: [
      'The Living Culture of Sourdough',
      'How Industrial Bread Is Made',
      'A History of Wheat Farming',
      'Why Bread Contains Sugar',
    ],
    mainIdeas: [
      'Sourdough depends on a changing microbial culture rather than fixed timings.',
      'A sourdough starter is a fixed chemical recipe.',
      'Warm starters always produce the sharpest flavour.',
      'Sourdough contains no living organisms.',
    ],
  },
  {
    title: 'Light Pollution and the Vanishing Night Sky',
    text:
      'Street lighting makes cities safer and busier, but it also changes the sky. Light that escapes upwards is scattered by dust and water droplets, creating a glow that hides faint stars and disturbs nocturnal animals. Migrating birds can be drawn off course, moths exhaust themselves around lamps, and some trees delay leaf fall near bright streets. The problem is not brightness alone: the direction, colour and timing of light matter. Shields that point light downwards, warmer colours and switches that turn off after midnight reduce the effect at little cost. Dark skies are therefore not a demand to switch everything off, but a request to use light where and when it is actually needed.',
    gaps: ['scattered', 'nocturnal', 'shields'],
    gapDistractors: [
      ['absorbed', 'blocked', 'cooled'],
      ['domestic', 'seasonal', 'coastal'],
      ['towers', 'cables', 'windows'],
    ],
    highlights: [
      'Light that escapes upwards is scattered by dust and water droplets, creating a glow that hides faint stars and disturbs nocturnal animals.',
      'Dark skies are therefore not a demand to switch everything off, but a request to use light where and when it is actually needed.',
    ],
    titles: [
      'Light Pollution and the Vanishing Night Sky',
      'How Street Lamps Are Manufactured',
      'The Biology of Moths',
      'Why Cities Need Brighter Streets',
    ],
    mainIdeas: [
      'Light pollution is about direction, colour and timing as much as brightness.',
      'Cities must remove all street lighting to protect wildlife.',
      'Only the brightness of lamps affects the night sky.',
      'Migrating birds are unaffected by artificial light.',
    ],
  },
  {
    title: 'How Railways Standardised Time',
    text:
      'Before railways, every town kept its own time, set by the sun. That was tolerable when a journey took days, but trains made the difference visible: a passenger could leave one station and arrive at another whose clock disagreed by twenty minutes. Railway companies therefore imposed a single time across their networks, and governments later made it law. The change was unpopular with some workers and astronomers, who argued that local noon had a physical meaning that a timetable did not. Standard time won because coordination was more valuable than solar accuracy. The episode is a useful example of infrastructure reshaping how people experience something as ordinary as the hour.',
    gaps: ['imposed', 'coordination', 'infrastructure'],
    gapDistractors: [
      ['measured', 'forgave', 'removed'],
      ['accuracy', 'silence', 'competition'],
      ['weather', 'language', 'education'],
    ],
    highlights: [
      'Railway companies therefore imposed a single time across their networks, and governments later made it law.',
      'The episode is a useful example of infrastructure reshaping how people experience something as ordinary as the hour.',
    ],
    titles: [
      'How Railways Standardised Time',
      'The Invention of the Clock',
      'Why Time Zones Are Abolished',
      'A History of Train Travel',
    ],
    mainIdeas: [
      'Standard time spread because railway coordination mattered more than local solar time.',
      'Standard time was introduced by astronomers to improve accuracy.',
      'Every town still keeps its own solar time today.',
      'Railways had no effect on how time was measured.',
    ],
  },
  {
    title: 'Seed Banks as Insurance for Agriculture',
    text:
      'A seed bank looks like a library with very small books. Its purpose is to preserve genetic variety that farmers and breeders may need when diseases or climates change. Seeds are dried, sealed and stored at low temperature, and samples are tested periodically to check that they can still germinate. The work is slower than it appears: a single variety may need regeneration every few decades, which means growing it out, collecting fresh seed and avoiding cross-pollination. Seed banks cannot save everything, and they are a backup rather than a substitute for growing crops in fields. Still, the loss of a collection is permanent in a way that a failed harvest is not.',
    gaps: ['germinate', 'regeneration', 'pollination'],
    gapDistractors: [
      ['freeze', 'ripen', 'travel'],
      ['packaging', 'labelling', 'export'],
      ['irrigation', 'harvesting', 'storage'],
    ],
    highlights: [
      'Seeds are dried, sealed and stored at low temperature, and samples are tested periodically to check that they can still germinate.',
      'Still, the loss of a collection is permanent in a way that a failed harvest is not.',
    ],
    titles: [
      'Seed Banks as Insurance for Agriculture',
      'How to Build a Greenhouse',
      'The History of Wheat Breeding',
      'Why Farmers Abandon Old Varieties',
    ],
    mainIdeas: [
      'Seed banks preserve genetic options but require continual regeneration work.',
      'Seed banks can replace the need to grow crops in fields.',
      'Stored seeds remain viable forever without testing.',
      'Cross-pollination improves the accuracy of seed storage.',
    ],
  },
  {
    title: 'The Physics of Skateboarding',
    text:
      'A skateboarder seems to defy friction, but the tricks depend on it. When the board approaches a ramp, the rider bends their knees and pushes down, transferring energy into the curved surface. At the top, that energy becomes height; on the way back, it returns as speed. Turning is a separate problem. Leaning shifts the rider\'s weight, the trucks compress unevenly, and the wheels follow an arc. Beginners often try to turn with their shoulders alone and slide out, because the board responds to pressure rather than to intention. The best skaters look relaxed because they are making many small adjustments, not because the board is easy to control.',
    gaps: ['curved', 'compress', 'adjustments'],
    gapDistractors: [
      ['flat', 'rough', 'narrow'],
      ['rotate', 'expand', 'polish'],
      ['decisions', 'obstacles', 'competitions'],
    ],
    highlights: [
      'When the board approaches a ramp, the rider bends their knees and pushes down, transferring energy into the curved surface.',
      'The best skaters look relaxed because they are making many small adjustments, not because the board is easy to control.',
    ],
    titles: [
      'The Physics of Skateboarding',
      'A History of Skate Parks',
      'How Wheels Are Manufactured',
      'Why Beginners Should Avoid Ramps',
    ],
    mainIdeas: [
      'Skateboarding depends on energy transfer and continuous small adjustments.',
      'Skateboarding is possible only without friction.',
      'Turning is controlled mainly by the shoulders.',
      'Experienced skaters make fewer adjustments than beginners.',
    ],
  },
  {
    title: 'How Migrating Birds Combine Compasses',
    text:
      'Migrating birds find their way using more than one sense. Experiments with robins show that they can orient themselves by the Earth\'s magnetic field, but they also use the sun, the stars and familiar landmarks. On cloudy nights, magnetic information becomes more important; on clear days, the position of the sun can override it. Young birds appear to learn a route by following adults and by memorising landscape features, while the magnetic sense provides a rough compass. The system is redundant by design, which is why removing a single cue rarely stops a migration. Navigation is not a single map but a set of overlapping instructions that can compensate when one is unavailable.',
    gaps: ['orient', 'override', 'redundant'],
    gapDistractors: [
      ['feed', 'breed', 'rest'],
      ['delay', 'copy', 'reduce'],
      ['simple', 'random', 'silent'],
    ],
    highlights: [
      'Experiments with robins show that they can orient themselves by the Earth\'s magnetic field, but they also use the sun, the stars and familiar landmarks.',
      'Navigation is not a single map but a set of overlapping instructions that can compensate when one is unavailable.',
    ],
    titles: [
      'How Migrating Birds Combine Compasses',
      'The Anatomy of Bird Wings',
      'Why Birds Migrate South',
      'The History of Ornithology',
    ],
    mainIdeas: [
      'Birds navigate with overlapping cues that compensate for one another.',
      'Birds rely on a single magnetic sense for all navigation.',
      'Cloudy weather prevents all bird migration.',
      'Young birds are born with a complete route map.',
    ],
  },
  {
    title: 'The Materials Behind the Pencil',
    text:
      'The modern pencil began as a lump of graphite wrapped in string. Pure graphite was scarce and soft, so manufacturers ground it, mixed it with clay and fired the mixture into rods. The ratio of clay to graphite determines hardness: more clay gives a faint, durable line for technical drawing, while more graphite gives the dark mark of a sketching pencil. The wooden casing arrived later, partly to stop the graphite from breaking and partly to make an expensive material go further. Pencils therefore record a series of compromises between supply, strength and the darkness of a line. Even a disposable object carries the history of the materials used to make it.',
    gaps: ['graphite', 'durable', 'compromises'],
    gapDistractors: [
      ['chalk', 'wax', 'ink'],
      ['temporary', 'fragile', 'invisible'],
      ['orders', 'machines', 'prices'],
    ],
    highlights: [
      'The ratio of clay to graphite determines hardness: more clay gives a faint, durable line for technical drawing, while more graphite gives the dark mark of a sketching pencil.',
      'Even a disposable object carries the history of the materials used to make it.',
    ],
    titles: [
      'The Materials Behind the Pencil',
      'The Invention of Paper',
      'How Erasers Work',
      'A History of Technical Drawing',
    ],
    mainIdeas: [
      'The pencil reflects compromises among scarce materials, strength and line quality.',
      'Pencils are made from a single natural material.',
      'More clay produces a darker pencil line.',
      'Wooden casings were added only for decoration.',
    ],
  },
  {
    title: 'How Noise-Cancelling Headphones Work',
    text:
      'Noise-cancelling headphones do not block sound in the way earplugs do. A microphone samples the incoming wave and a circuit generates an opposite wave, so the two largely cancel before they reach the ear. The method works best on steady low sounds such as engine hum, because the circuit has time to predict them. Sudden noises and human speech are harder: they change too quickly, and imperfect cancellation can leave an odd pressure sensation. The headphones also consume power and can make users less aware of alarms or traffic. Their value is therefore specific. They are excellent for a long flight and a poor substitute for attention when crossing a street.',
    gaps: ['cancel', 'steady', 'imperfect'],
    gapDistractors: [
      ['amplify', 'record', 'delay'],
      ['sudden', 'distant', 'musical'],
      ['complete', 'silent', 'automatic'],
    ],
    highlights: [
      'A microphone samples the incoming wave and a circuit generates an opposite wave, so the two largely cancel before they reach the ear.',
      'They are excellent for a long flight and a poor substitute for attention when crossing a street.',
    ],
    titles: [
      'How Noise-Cancelling Headphones Work',
      'The History of the Earplug',
      'Why Cities Are Getting Louder',
      'How to Choose a Music Player',
    ],
    mainIdeas: [
      'Noise cancellation suits steady low sounds and is unreliable for sudden ones.',
      'Noise-cancelling headphones block all sounds equally well.',
      'The technique works by amplifying the incoming wave.',
      'Earplugs and headphones use identical methods.',
    ],
  },
  {
    title: 'Coral Restoration as First Aid',
    text:
      'Coral reefs can recover after bleaching, but only if the conditions that caused the damage improve. Restoration projects therefore begin with water quality and fishing rules rather than with coral. Where the reef is stable, divers attach small fragments grown in nurseries, a method that speeds up growth but cannot create a reef from nothing. Genetic diversity matters: a garden of identical fragments may survive one hot summer and fail the next. Some teams now breed corals that tolerate higher temperatures, though critics warn that this could distract from the harder work of reducing emissions. Restoration is best understood as first aid, not a cure for the warming ocean.',
    gaps: ['bleaching', 'fragments', 'diversity'],
    gapDistractors: [
      ['flooding', 'erosion', 'harvesting'],
      ['currents', 'predators', 'nets'],
      ['weight', 'colour', 'depth'],
    ],
    highlights: [
      'Restoration projects therefore begin with water quality and fishing rules rather than with coral.',
      'Restoration is best understood as first aid, not a cure for the warming ocean.',
    ],
    titles: [
      'Coral Restoration as First Aid',
      'How Coral Reefs Form',
      'The Economics of Fishing',
      'Why Oceans Are Becoming Colder',
    ],
    mainIdeas: [
      'Restoration can help damaged reefs but cannot replace action on warming.',
      'Coral gardening can rebuild a reef without healthy water.',
      'Genetic uniformity makes corals more resilient.',
      'Bleaching is caused mainly by fishing nets.',
    ],
  },
  {
    title: 'Building Habits Around Existing Cues',
    text:
      'Habits are often described as actions that have become automatic, but the useful question is how they start. Research on behaviour change suggests that a new routine is easier to establish when it is attached to an existing cue: after breakfast, before leaving the house, at the end of a meeting. The cue reduces the need to decide, and repetition makes the action feel normal. Rewards matter less than people expect, and grand plans tend to fail because they demand too much at once. Small changes that survive a bad week are more likely to last than ambitious ones that require perfect conditions. The goal is not motivation but a reliable trigger.',
    gaps: ['automatic', 'establish', 'trigger'],
    gapDistractors: [
      ['painful', 'public', 'temporary'],
      ['forget', 'measure', 'replace'],
      ['reward', 'excuse', 'result'],
    ],
    highlights: [
      'Research on behaviour change suggests that a new routine is easier to establish when it is attached to an existing cue: after breakfast, before leaving the house, at the end of a meeting.',
      'The goal is not motivation but a reliable trigger.',
    ],
    titles: [
      'Building Habits Around Existing Cues',
      'The Neuroscience of Willpower',
      'Why Rewards Always Work',
      'How to Break Every Habit in a Week',
    ],
    mainIdeas: [
      'Habits form more reliably from small actions tied to existing cues.',
      'Large ambitious plans are the most reliable way to change behaviour.',
      'Rewards are the only factor in habit formation.',
      'Habits require constant motivation to continue.',
    ],
  },
  {
    title: 'Water Mills and Village Power',
    text:
      'Medieval water mills were not simply machines for grinding grain. They were legal and social arrangements as well. A mill required a weir, a channel and a pond, which changed the flow of the river and could flood a neighbour\'s field. Lords who owned the mill often required tenants to use it and to pay a share of the flour, a practice that made milling a source of income as well as a service. Disputes over water rights appear in court records for centuries. The technology was modest, but its organisation shaped village life. Studying the mill therefore means studying property, labour and engineering at the same time.',
    gaps: ['weir', 'tenants', 'disputes'],
    gapDistractors: [
      ['bridge', 'road', 'tower'],
      ['owners', 'guards', 'merchants'],
      ['harvests', 'machines', 'festivals'],
    ],
    highlights: [
      'A mill required a weir, a channel and a pond, which changed the flow of the river and could flood a neighbour\'s field.',
      'Studying the mill therefore means studying property, labour and engineering at the same time.',
    ],
    titles: [
      'Water Mills and Village Power',
      'The Invention of the Windmill',
      'How Flour Is Refined',
      'Medieval Farming Techniques',
    ],
    mainIdeas: [
      'Water mills were social and legal institutions as well as machines.',
      'Medieval mills had no effect on river flow.',
      'Tenants were never required to use a lord\'s mill.',
      'Milling was unrelated to property rights.',
    ],
  },
  {
    title: 'Keeping Vaccines Cold from Factory to Clinic',
    text:
      'A vaccine is only useful if it is still potent when it reaches the patient. Many vaccines must be kept within a narrow temperature range from the factory to the clinic, a system known as the cold chain. The difficulty is not the refrigerator but the gaps between them: a delayed truck, a power cut or a door left open can spoil a whole box. Health programmes therefore use insulated containers, temperature indicators and strict stock rotation. Solar-powered coolers have extended reach in areas without reliable electricity, but they still need maintenance and spare parts. The weakest link is usually the last kilometre, where a clinic may have no trained technician on duty.',
    gaps: ['potent', 'insulated', 'maintenance'],
    gapDistractors: [
      ['visible', 'affordable', 'portable'],
      ['painted', 'opened', 'labelled'],
      ['advertising', 'competition', 'storage'],
    ],
    highlights: [
      'The difficulty is not the refrigerator but the gaps between them: a delayed truck, a power cut or a door left open can spoil a whole box.',
      'The weakest link is usually the last kilometre, where a clinic may have no trained technician on duty.',
    ],
    titles: [
      'Keeping Vaccines Cold from Factory to Clinic',
      'How Vaccines Are Invented',
      'The History of Refrigeration',
      'Why Clinics Need More Doctors',
    ],
    mainIdeas: [
      'Cold-chain failure is most likely in the final stage of delivery.',
      'Vaccines remain effective at any temperature.',
      'Solar coolers remove the need for maintenance.',
      'The factory refrigerator is the weakest part of the system.',
    ],
  },
  {
    title: 'Terraces as Water Management',
    text:
      'Terraces turn a steep slope into a series of flat fields, but their purpose is not only to make planting easier. Each wall slows water running downhill, giving it time to soak into the soil instead of carrying it away. Over centuries, farmers in mountainous regions built terraces with stone, earth and local plants, and the structures became part of the landscape. When terraces are abandoned, the walls collapse and the soil erodes quickly. Modern restoration projects sometimes rebuild them with machines, which is faster but can compact the ground and damage the drainage that made the system work. The old design is not merely picturesque; it encodes practical knowledge about water.',
    gaps: ['erodes', 'compact', 'drainage'],
    gapDistractors: [
      ['freezes', 'expands', 'settles'],
      ['flood', 'fertilise', 'irrigate'],
      ['colour', 'weight', 'price'],
    ],
    highlights: [
      'Each wall slows water running downhill, giving it time to soak into the soil instead of carrying it away.',
      'The old design is not merely picturesque; it encodes practical knowledge about water.',
    ],
    titles: [
      'Terraces as Water Management',
      'The Geology of Mountains',
      'How to Build a Stone Wall',
      'The Decline of Mountain Villages',
    ],
    mainIdeas: [
      'Terraces control water and soil, and their design carries practical knowledge.',
      'Terraces exist only to make slopes look attractive.',
      'Abandoned terraces stabilize soil over time.',
      'Machine-built terraces always improve drainage.',
    ],
  },
  {
    title: 'The Chemistry of Natural Dyes',
    text:
      'Before synthetic colours, dyers worked with plants, insects and minerals, and the results were rarely simple. A red from madder changes with the mordant, a metal salt that fixes the dye to the fibre. Iron gives a dark, dull tone; alum gives a brighter one. The same bath can produce different shades on wool and cotton, and the water supply affects the outcome. Recipes were therefore guarded knowledge, passed between families and guilds. Synthetic dyes replaced them because they were cheaper and more predictable, not because the old colours were inferior. Modern craft dyers are rediscovering the variables that industrial chemistry removed, including the uncertainty that makes each batch distinct.',
    gaps: ['mordant', 'predictable', 'variables'],
    gapDistractors: [
      ['loom', 'needle', 'pattern'],
      ['expensive', 'fragile', 'seasonal'],
      ['machines', 'markets', 'workers'],
    ],
    highlights: [
      'A red from madder changes with the mordant, a metal salt that fixes the dye to the fibre.',
      'Modern craft dyers are rediscovering the variables that industrial chemistry removed, including the uncertainty that makes each batch distinct.',
    ],
    titles: [
      'The Chemistry of Natural Dyes',
      'The History of Synthetic Fibres',
      'How Wool Is Spun',
      'Why Natural Dyes Disappeared',
    ],
    mainIdeas: [
      'Natural dyeing depended on chemistry and local conditions, making results variable.',
      'Natural dyes were abandoned because their colours were always dull.',
      'A mordant is a machine used to weave cloth.',
      'Synthetic dyes produce different shades on every fibre.',
    ],
  },
  {
    title: 'Repair Cafés and the Value of Knowing How',
    text:
      'Repair cafés began as small volunteer events where people brought broken appliances and learned to fix them with help. Their environmental case is obvious, but their social effect may be more important. A visitor arrives with a faulty lamp and leaves knowing how a switch works, where to buy a part and who else in the neighbourhood repairs things. Manufacturers sometimes make this difficult by gluing components or withholding manuals, and volunteers document those barriers. The movement therefore produces two kinds of knowledge: practical skill and evidence for policy. It cannot replace professional repair, and it does not divert most waste from landfill. Its value lies in changing what people believe is possible.',
    gaps: ['appliances', 'withholding', 'divert'],
    gapDistractors: [
      ['documents', 'furniture', 'clothes'],
      ['publishing', 'copying', 'translating'],
      ['collect', 'increase', 'sort'],
    ],
    highlights: [
      'A visitor arrives with a faulty lamp and leaves knowing how a switch works, where to buy a part and who else in the neighbourhood repairs things.',
      'Its value lies in changing what people believe is possible.',
    ],
    titles: [
      'Repair Cafés and the Value of Knowing How',
      'The History of Appliance Manufacturing',
      'Why Recycling Is Enough',
      'How to Open a Café',
    ],
    mainIdeas: [
      'Repair cafés build practical skill and evidence, not just waste reduction.',
      'Repair cafés have replaced professional repair services.',
      'Manufacturers make repairs easier by gluing components.',
      'The main benefit of repair cafés is landfill diversion.',
    ],
  },
  {
    title: 'Forecasting Eruptions from Many Signals',
    text:
      'Predicting an eruption is not a single measurement but a pattern of them. Instruments record small earthquakes, changes in the shape of the ground and the composition of gases escaping from the crater. An increase in sulphur dioxide may suggest that magma is rising, while swelling of the surface indicates that pressure is building. None of these signals is reliable alone, and similar patterns can end without an eruption. Scientists therefore combine data with local knowledge and communicate uncertainty rather than a simple warning. False alarms are costly because they erode trust, yet a missed eruption is worse. Forecasting is a negotiation between evidence, timing and public patience.',
    gaps: ['composition', 'swelling', 'uncertainty'],
    gapDistractors: [
      ['temperature', 'weight', 'colour'],
      ['cooling', 'silence', 'erosion'],
      ['certainty', 'silence', 'speed'],
    ],
    highlights: [
      'An increase in sulphur dioxide may suggest that magma is rising, while swelling of the surface indicates that pressure is building.',
      'Forecasting is a negotiation between evidence, timing and public patience.',
    ],
    titles: [
      'Forecasting Eruptions from Many Signals',
      'The Destructive Power of Lava',
      'How Volcanoes Form Islands',
      'The History of Seismology',
    ],
    mainIdeas: [
      'Eruption forecasts combine several imperfect signals and must convey uncertainty.',
      'A single gas measurement can predict every eruption.',
      'False alarms have no cost for public trust.',
      'Ground swelling always means an eruption is certain.',
    ],
  },
  {
    title: 'What Place Names Reveal About the Past',
    text:
      'Place names are often treated as labels, but they record older languages and older landscapes. A river called by a Celtic word may keep that name after the language itself has disappeared, because newcomers adopted the name from the people they displaced. Names can also describe features that no longer exist: a street may be named after a market that closed centuries ago. Linguists use these layers to reconstruct settlement patterns, and historians use them cautiously, because a name can be transferred from one place to another. The study is therefore a form of archaeology conducted through language, and it requires the same care about evidence and uncertainty.',
    gaps: ['displaced', 'transferred', 'archaeology'],
    gapDistractors: [
      ['employed', 'educated', 'sheltered'],
      ['divided', 'forgotten', 'painted'],
      ['geology', 'biology', 'astronomy'],
    ],
    highlights: [
      'A river called by a Celtic word may keep that name after the language itself has disappeared, because newcomers adopted the name from the people they displaced.',
      'The study is therefore a form of archaeology conducted through language, and it requires the same care about evidence and uncertainty.',
    ],
    titles: [
      'What Place Names Reveal About the Past',
      'How Modern Maps Are Drawn',
      'The Origins of Family Names',
      'Why Languages Disappear',
    ],
    mainIdeas: [
      'Place names preserve linguistic and landscape history but must be read cautiously.',
      'Place names always describe features that still exist.',
      'Names disappear immediately when a language dies.',
      'Place-name study is unrelated to settlement history.',
    ],
  },
  {
    title: 'Shift Work Against the Body Clock',
    text:
      'Shift workers do not simply sleep less; they sleep at the wrong biological time. The body clock expects darkness at night, and it controls temperature, digestion and alertness as well as sleep. A nurse who finishes at seven in the morning may go to bed while the body is preparing to wake, so sleep is shorter and lighter even when the hours are available. Blackout curtains, consistent bedtimes and planned naps help, but they cannot fully override the mismatch. Employers can reduce the harm by limiting consecutive night shifts and allowing predictable schedules. The problem is therefore not a lack of discipline in individual workers but a conflict between rosters and biology.',
    gaps: ['biological', 'mismatch', 'rosters'],
    gapDistractors: [
      ['social', 'legal', 'mechanical'],
      ['delay', 'reward', 'signal'],
      ['buildings', 'uniforms', 'salaries'],
    ],
    highlights: [
      'A nurse who finishes at seven in the morning may go to bed while the body is preparing to wake, so sleep is shorter and lighter even when the hours are available.',
      'The problem is therefore not a lack of discipline in individual workers but a conflict between rosters and biology.',
    ],
    titles: [
      'Shift Work Against the Body Clock',
      'The History of Nursing',
      'How to Sleep Eight Hours',
      'Why Night Work Pays More',
    ],
    mainIdeas: [
      'Shift-work sleep loss comes from a conflict between schedules and body time.',
      'Shift workers sleep badly because they lack discipline.',
      'Blackout curtains fully solve the problem of night work.',
      'The body clock has no effect on digestion.',
    ],
  },
  {
    title: 'The Engineering of Spider Silk',
    text:
      'Spider silk is stronger than steel for its weight, yet a spider produces it at body temperature from water and protein. The thread contains regions that form rigid crystals and regions that remain flexible, and the mixture gives it both strength and stretch. A web can absorb the impact of an insect without breaking because the energy is distributed along the threads and the joints. Engineers have tried to copy the process, but synthetic fibres usually require heat, solvents or both. Producing a material with the same structure at room temperature remains difficult. The spider is therefore an efficient factory, and its advantage lies in the conditions it avoids as much as in the material it makes.',
    gaps: ['rigid', 'distributed', 'solvents'],
    gapDistractors: [
      ['hollow', 'sticky', 'transparent'],
      ['removed', 'concentrated', 'measured'],
      ['machines', 'colours', 'weights'],
    ],
    highlights: [
      'The thread contains regions that form rigid crystals and regions that remain flexible, and the mixture gives it both strength and stretch.',
      'The spider is therefore an efficient factory, and its advantage lies in the conditions it avoids as much as in the material it makes.',
    ],
    titles: [
      'The Engineering of Spider Silk',
      'How Spiders Catch Prey',
      'The Chemistry of Steel',
      'Why Synthetic Fibres Are Stronger',
    ],
    mainIdeas: [
      'Spider silk combines strength and stretch through structure, and is made under mild conditions.',
      'Spider silk is weaker than steel at every scale.',
      'Synthetic fibres already match silk without heat or solvents.',
      'A web breaks because energy is concentrated in one thread.',
    ],
  },
  {
    title: 'Why Paper Cannot Be Recycled Forever',
    text:
      'Paper can be recycled several times, but not indefinitely. Each cycle shortens the cellulose fibres, and shorter fibres produce weaker paper. Offices therefore separate high-grade white paper from newspapers and cardboard, because mixing them reduces the value of the batch. Contamination matters too: a greasy pizza box or a plastic window in an envelope can spoil a whole load. Recycling saves landfill space and some energy compared with making pulp from trees, but the comparison depends on transport, mill efficiency and the quality of the substitute. The most effective policy is not simply to recycle more, but to keep clean paper in a separate stream and to design packaging that is easy to separate.',
    gaps: ['cellulose', 'contamination', 'substitute'],
    gapDistractors: [
      ['mineral', 'protein', 'plastic'],
      ['weight', 'printing', 'storage'],
      ['product', 'machine', 'market'],
    ],
    highlights: [
      'Each cycle shortens the cellulose fibres, and shorter fibres produce weaker paper.',
      'The most effective policy is not simply to recycle more, but to keep clean paper in a separate stream and to design packaging that is easy to separate.',
    ],
    titles: [
      'Why Paper Cannot Be Recycled Forever',
      'The History of Papermaking',
      'How Cardboard Boxes Are Printed',
      'The Economics of Landfill',
    ],
    mainIdeas: [
      'Recycling paper degrades fibres, so quality and separation matter.',
      'Paper fibres become stronger each time they are recycled.',
      'All paper waste can be recycled together without loss.',
      'Recycling paper is always better regardless of transport.',
    ],
  },
  {
    title: 'Sign Languages as Spatial Grammar',
    text:
      'Sign languages are not gestures that accompany spoken language; they are complete languages with their own grammar. One striking feature is how they use space. A signer can place a person or object at a location in front of the body and later refer back to that location, so the space itself carries meaning. Different sign languages do this differently, and a learner cannot simply translate word for word from a spoken language. The visual channel also allows simultaneity: a facial expression can mark a question while the hands describe an action. Studying these structures has changed linguists\' assumptions about what grammar must look like, because it shows that language does not depend on sound.',
    gaps: ['gestures', 'simultaneity', 'assumptions'],
    gapDistractors: [
      ['accents', 'letters', 'pauses'],
      ['silence', 'distance', 'formality'],
      ['rules', 'sounds', 'habits'],
    ],
    highlights: [
      'A signer can place a person or object at a location in front of the body and later refer back to that location, so the space itself carries meaning.',
      'Studying these structures has changed linguists\' assumptions about what grammar must look like, because it shows that language does not depend on sound.',
    ],
    titles: [
      'Sign Languages as Spatial Grammar',
      'The History of Finger Spelling',
      'How Children Learn to Read',
      'Why Gestures Replace Words',
    ],
    mainIdeas: [
      'Sign languages use space and simultaneity as grammatical resources.',
      'Sign languages are gesture systems without grammar.',
      'Sign languages translate spoken words one by one.',
      'All sign languages share a single spatial grammar.',
    ],
  },
  {
    title: 'The Air Underground',
    text:
      'Air quality on underground railways is often worse than on the street above. Trains grind metal wheels against rails, brakes release particles, and the enclosed tunnels trap what is produced. The particles are partly iron-rich dust, which behaves differently from traffic exhaust and may have different health effects. Ventilation helps, but it also pulls in air from the surface, so the benefit depends on the city above. Platform screen doors reduce exposure for waiting passengers, and improved braking materials cut the source. The problem is easy to ignore because the journey is short, but millions of short journeys add up. Monitoring is the first step, since a system that is not measured cannot be improved.',
    gaps: ['enclosed', 'ventilation', 'exposure'],
    gapDistractors: [
      ['raised', 'lighted', 'decorated'],
      ['ticketing', 'lighting', 'policing'],
      ['payment', 'distance', 'noise'],
    ],
    highlights: [
      'Trains grind metal wheels against rails, brakes release particles, and the enclosed tunnels trap what is produced.',
      'Monitoring is the first step, since a system that is not measured cannot be improved.',
    ],
    titles: [
      'The Air Underground',
      'The History of the London Tube',
      'How Trains Are Built',
      'Why Cycling Is Dangerous',
    ],
    mainIdeas: [
      'Underground air quality is a measurable problem caused by wear and trapped particles.',
      'Subway air is always cleaner than street air.',
      'Ventilation removes all particles from tunnels.',
      'The health effects of subway dust are fully understood.',
    ],
  },
  {
    title: 'Lichens as Partners and Pollution Indicators',
    text:
      'A lichen is not a single organism but a partnership between a fungus and an alga or a bacterium. The fungus provides shelter and absorbs water, while the partner photosynthesises and supplies sugar. The arrangement is so stable that lichens can grow on bare rock, where neither partner could survive alone. They are also sensitive to pollution, especially sulphur dioxide, which is why they are used as indicators of air quality. A return of lichens to a city centre is therefore a sign that the air has improved, though the interpretation requires care because different species tolerate different conditions. Slow growth makes them poor at recovering quickly, and a damaged community may take decades to return.',
    gaps: ['partnership', 'tolerate', 'interpretation'],
    gapDistractors: [
      ['competition', 'journey', 'barrier'],
      ['produce', 'attract', 'avoid'],
      ['measurement', 'construction', 'education'],
    ],
    highlights: [
      'The fungus provides shelter and absorbs water, while the partner photosynthesises and supplies sugar.',
      'Slow growth makes them poor at recovering quickly, and a damaged community may take decades to return.',
    ],
    titles: [
      'Lichens as Partners and Pollution Indicators',
      'The Biology of Fungi',
      'How Rocks Are Formed',
      'Why Cities Have No Wildlife',
    ],
    mainIdeas: [
      'Lichens are symbiotic organisms whose sensitivity makes them useful pollution indicators.',
      'A lichen is a single species of fungus.',
      'Lichens grow quickly and recover within a season.',
      'All lichen species tolerate the same level of pollution.',
    ],
  },
  {
    title: 'The Design of Flood Insurance',
    text:
      'Flood insurance is difficult because the risk is concentrated. A single storm can damage thousands of homes at once, so insurers cannot rely on the fact that most policyholders will not claim in the same year. Premiums that reflect the true risk would be unaffordable for the people living closest to rivers and coasts, and withdrawing cover would leave them without a market. Many governments therefore share the risk, subsidise premiums or require new buildings to meet flood standards. Each solution creates a different incentive: cheap insurance may encourage building in dangerous places, while strict pricing may push poor households out. The design of the scheme matters as much as the accuracy of the flood map.',
    gaps: ['concentrated', 'subsidise', 'incentive'],
    gapDistractors: [
      ['limited', 'hidden', 'temporary'],
      ['inspect', 'prohibit', 'measure'],
      ['penalty', 'barrier', 'record'],
    ],
    highlights: [
      'Premiums that reflect the true risk would be unaffordable for the people living closest to rivers and coasts, and withdrawing cover would leave them without a market.',
      'The design of the scheme matters as much as the accuracy of the flood map.',
    ],
    titles: [
      'The Design of Flood Insurance',
      'How Storms Form',
      'The History of House Building',
      'Why Maps Are Inaccurate',
    ],
    mainIdeas: [
      'Flood insurance requires risk-sharing because losses are concentrated, and scheme design shapes behaviour.',
      'Flood insurance is easy because claims are spread evenly over time.',
      'Risk-based premiums are affordable for every household.',
      'Flood maps alone determine the success of insurance.',
    ],
  },
  {
    title: 'What Landfills Tell Archaeologists',
    text:
      'Archaeologists usually study abandoned settlements, but some now dig through modern landfills. The layers record what people bought, threw away and repaired, and the material survives better than many written records. One surprising finding is how much food waste remains identifiable decades later, which challenges assumptions about how quickly organic matter decomposes in a sealed tip. The method has limits: a landfill is not a random sample of a household, and the people who produced the waste may still be alive and able to explain it. Researchers therefore combine excavation with interviews. The approach treats rubbish as evidence, not as a moral judgement about consumption.',
    gaps: ['settlements', 'decomposes', 'excavation'],
    gapDistractors: [
      ['museums', 'markets', 'machines'],
      ['travels', 'freezes', 'multiplies'],
      ['interviews', 'storage', 'transport'],
    ],
    highlights: [
      'One surprising finding is how much food waste remains identifiable decades later, which challenges assumptions about how quickly organic matter decomposes in a sealed tip.',
      'The approach treats rubbish as evidence, not as a moral judgement about consumption.',
    ],
    titles: [
      'What Landfills Tell Archaeologists',
      'The History of Waste Collection',
      'How Soil Is Formed',
      'Why Recycling Began',
    ],
    mainIdeas: [
      'Modern landfill archaeology reveals consumption and decomposition, with limits that require other evidence.',
      'Landfills are random samples of household behaviour.',
      'Organic waste disappears completely within a year.',
      'Rubbish is useful only as a moral judgement.',
    ],
  },
  {
    title: 'Why Bridges Hum in the Wind',
    text:
      'A bridge can hum, sing or vibrate in a way that alarms pedestrians even when it is perfectly safe. The cause is usually resonance: wind passing around cables or railings creates small rhythmic forces, and if their frequency matches a natural frequency of the structure, the movement grows. Engineers test models in wind tunnels and add dampers or change the shape of a railing to break the rhythm. The famous failure of a suspension bridge in 1940 was a different phenomenon, but it taught the same lesson: a structure can respond to forces that are invisible in still air. Design codes now require designers to consider vibration as a normal load, not an exceptional accident.',
    gaps: ['resonance', 'dampers', 'vibration'],
    gapDistractors: [
      ['erosion', 'tension', 'gravity'],
      ['towers', 'signs', 'lights'],
      ['traffic', 'weather', 'paint'],
    ],
    highlights: [
      'The cause is usually resonance: wind passing around cables or railings creates small rhythmic forces, and if their frequency matches a natural frequency of the structure, the movement grows.',
      'Design codes now require designers to consider vibration as a normal load, not an exceptional accident.',
    ],
    titles: [
      'Why Bridges Hum in the Wind',
      'The History of Bridge Design',
      'How Concrete Is Mixed',
      'The Physics of Earthquakes',
    ],
    mainIdeas: [
      'Bridge hum comes from wind-driven resonance, which designers now treat as a normal load.',
      'Bridges hum because their materials are wet.',
      'Dampers increase resonance in cables.',
      'Vibration is an exceptional accident that codes ignore.',
    ],
  },
  {
    title: 'Digital Preservation Is Maintenance',
    text:
      'Digital files feel permanent because they can be copied without loss, yet copies are not the same as preservation. A format may become unreadable when the software that created it disappears, and a storage medium may fail silently. Archives therefore plan for migration: moving records to new formats and checking that nothing is lost in the process. Metadata is as important as the file itself, because a photograph without a date, owner or description is difficult to interpret later. The work is continuous, unlike the one-time act of placing a book on a shelf. A digital collection is less a building than a service that must be maintained, funded and tested.',
    gaps: ['migration', 'metadata', 'continuous'],
    gapDistractors: [
      ['printing', 'translation', 'storage'],
      ['paperwork', 'furniture', 'lighting'],
      ['optional', 'temporary', 'manual'],
    ],
    highlights: [
      'Archives therefore plan for migration: moving records to new formats and checking that nothing is lost in the process.',
      'A digital collection is less a building than a service that must be maintained, funded and tested.',
    ],
    titles: [
      'Digital Preservation Is Maintenance',
      'The History of the Library',
      'How Hard Drives Store Data',
      'Why Paper Is Obsolete',
    ],
    mainIdeas: [
      'Digital archives require continual format migration and metadata, not one-time storage.',
      'Digital copies remain readable without maintenance.',
      'Metadata is unnecessary once a file is copied.',
      'Preservation ends when a file is placed on a drive.',
    ],
  },
  {
    title: 'The Uneven Case for Daylight Saving',
    text:
      'Daylight saving time is often justified by energy savings, but the evidence is mixed. When clocks shift, lighting demand falls in the evening and rises in the morning, and heating or cooling may change in the opposite direction. Studies find small effects that vary by climate and season. The policy also affects sleep: a one-hour change can disturb some people for several days, and the effect is larger in the spring. Farmers, airlines and broadcasters all have practical reasons to prefer one arrangement over another. The debate is therefore less about saving daylight than about which inconveniences a society is willing to distribute, and to whom.',
    gaps: ['justified', 'disturb', 'inconveniences'],
    gapDistractors: [
      ['explained', 'criticised', 'forgotten'],
      ['protect', 'inform', 'employ'],
      ['benefits', 'holidays', 'regulations'],
    ],
    highlights: [
      'Studies find small effects that vary by climate and season.',
      'The debate is therefore less about saving daylight than about which inconveniences a society is willing to distribute, and to whom.',
    ],
    titles: [
      'The Uneven Case for Daylight Saving',
      'The History of the Clock',
      'How Farmers Work',
      'Why Sleep Does Not Matter',
    ],
    mainIdeas: [
      'Daylight saving produces small, uneven effects and distributes inconvenience rather than saving daylight.',
      'Daylight saving reliably reduces total energy use everywhere.',
      'Clock changes have no effect on sleep.',
      'Farmers are the only group affected by the policy.',
    ],
  },
  {
    title: 'Antibiotics on the Farm',
    text:
      'Antibiotics are used in livestock not only to treat illness but also, in some places, to prevent disease in crowded sheds and to promote growth. The practice creates resistant bacteria that can reach people through food, water or direct contact. The link is difficult to measure precisely because many routes exist, but the direction is clear enough for regulators to act. Some countries banned growth promotion decades ago and saw resistance fall; others rely on veterinary prescriptions and better housing. The transition costs money, and farmers with thin margins resist it. A workable policy therefore combines restrictions with support for ventilation, vaccination and smaller stocking densities, because a rule without alternatives is likely to be ignored.',
    gaps: ['resistant', 'veterinary', 'densities'],
    gapDistractors: [
      ['friendly', 'seasonal', 'domestic'],
      ['industrial', 'financial', 'legal'],
      ['prices', 'breeds', 'distances'],
    ],
    highlights: [
      'The practice creates resistant bacteria that can reach people through food, water or direct contact.',
      'A workable policy therefore combines restrictions with support for ventilation, vaccination and smaller stocking densities, because a rule without alternatives is likely to be ignored.',
    ],
    titles: [
      'Antibiotics on the Farm',
      'The Discovery of Penicillin',
      'How Meat Is Packaged',
      'The Economics of Dairy Farming',
    ],
    mainIdeas: [
      'Livestock antibiotic use drives resistance, and restrictions need practical alternatives.',
      'Growth-promoting antibiotics have no link to human health.',
      'Bans always fail without any support for farmers.',
      'Veterinary prescriptions are the only source of resistance.',
    ],
  },
  {
    title: 'The Physics of Ice Skating',
    text:
      'Ice skating looks frictionless, but the blade is not simply sliding on a smooth surface. Pressure from the thin edge lowers the melting point of the ice beneath it, creating a thin layer of water that lubricates the glide. Friction also generates heat, which adds to the effect. The blade is curved so that the skater can turn by leaning, and the edges are sharpened at different angles for different manoeuvres. A rink that is too cold feels slow and brittle; one that is too warm becomes soft and tiring. The sport therefore depends on a narrow range of conditions, and the skater is constantly reading the surface through the feet.',
    gaps: ['lubricates', 'manoeuvres', 'brittle'],
    gapDistractors: [
      ['cools', 'hardens', 'colours'],
      ['audiences', 'seasons', 'machines'],
      ['crowded', 'expensive', 'silent'],
    ],
    highlights: [
      'Pressure from the thin edge lowers the melting point of the ice beneath it, creating a thin layer of water that lubricates the glide.',
      'The sport therefore depends on a narrow range of conditions, and the skater is constantly reading the surface through the feet.',
    ],
    titles: [
      'The Physics of Ice Skating',
      'The History of Winter Sports',
      'How Ice Rinks Are Built',
      'Why Skates Need Sharpening',
    ],
    mainIdeas: [
      'Ice skating depends on pressure melting, friction and blade geometry.',
      'Skating is frictionless because ice never melts under a blade.',
      'Warmer ice is always faster for skaters.',
      'Blade shape has no effect on turning.',
    ],
  },
  {
    title: 'Community Land Trusts and Lasting Affordability',
    text:
      'A community land trust separates the ownership of land from the ownership of the building on it. The trust keeps the land in permanent community ownership and sells or leases the home at a price that excludes speculative gain. Buyers agree to resell to another eligible household at a formula set in advance, so the home stays affordable when the market rises. The model protects public investment, but it also limits what an owner can gain, which makes it unattractive to some buyers. It works best where land is expensive and public subsidy is available. The trust is therefore not a general solution to housing costs, but a way to make a subsidy last longer than one sale.',
    gaps: ['speculative', 'formula', 'subsidy'],
    gapDistractors: [
      ['seasonal', 'private', 'foreign'],
      ['meeting', 'contract', 'design'],
      ['market', 'tenant', 'street'],
    ],
    highlights: [
      'Buyers agree to resell to another eligible household at a formula set in advance, so the home stays affordable when the market rises.',
      'The trust is therefore not a general solution to housing costs, but a way to make a subsidy last longer than one sale.',
    ],
    titles: [
      'Community Land Trusts and Lasting Affordability',
      'The History of Home Ownership',
      'How Mortgages Are Calculated',
      'Why Rents Always Rise',
    ],
    mainIdeas: [
      'Community land trusts preserve affordability by separating land from building ownership.',
      'Community land trusts allow unlimited speculative gain.',
      'The model works equally well in every housing market.',
      'Public subsidy is irrelevant to land trusts.',
    ],
  },
  {
    title: 'How Cookbooks Learned to Instruct Strangers',
    text:
      'Early printed cookbooks did not read like modern recipes. They assumed a cook who already knew the techniques and gave quantities in vague terms such as a handful or a sufficient quantity. Instructions became more precise when authors began writing for readers who had never seen the dish prepared, and when ingredients became standardized enough to measure. The change was not only technical. A recipe that specifies exact amounts also implies a particular taste and a particular kitchen, often that of the author. Modern cookbooks continue this work by translating one cook\'s habits into instructions for strangers. Reading them as literature reveals assumptions about class, gender and household labour.',
    gaps: ['quantities', 'standardized', 'assumptions'],
    gapDistractors: [
      ['colours', 'prices', 'smells'],
      ['hidden', 'seasonal', 'expensive'],
      ['recipes', 'meals', 'kitchens'],
    ],
    highlights: [
      'Instructions became more precise when authors began writing for readers who had never seen the dish prepared, and when ingredients became standardized enough to measure.',
      'Reading them as literature reveals assumptions about class, gender and household labour.',
    ],
    titles: [
      'How Cookbooks Learned to Instruct Strangers',
      'The History of Agriculture',
      'Why Recipes Use Metrics',
      'The Chemistry of Cooking',
    ],
    mainIdeas: [
      'Cookbooks became precise as they addressed readers without prior knowledge, encoding social assumptions.',
      'Early cookbooks gave exact quantities for every ingredient.',
      'Recipes are neutral records with no cultural assumptions.',
      'Standardised ingredients ended the need for cookbooks.',
    ],
  },
  {
    title: 'Why Open-Plan Offices Are Noisy',
    text:
      'Open-plan offices are designed to encourage conversation, but they often make focused work harder. Sound travels across desks, and speech is especially distracting because the brain automatically processes meaning. Background music or white noise can mask some of it, but the effect depends on the task and the person. Acoustic panels, carpets and soft furniture absorb reflections, while screens and plants break lines of sight. The most effective solution is often organisational: placing teams that talk together near each other and quiet tasks in a separate room. A design that ignores the type of work being done will produce complaints even if the furniture is expensive.',
    gaps: ['distracting', 'reflections', 'organisational'],
    gapDistractors: [
      ['relaxing', 'visible', 'affordable'],
      ['meetings', 'deadlines', 'colleagues'],
      ['technical', 'seasonal', 'musical'],
    ],
    highlights: [
      'Sound travels across desks, and speech is especially distracting because the brain automatically processes meaning.',
      'A design that ignores the type of work being done will produce complaints even if the furniture is expensive.',
    ],
    titles: [
      'Why Open-Plan Offices Are Noisy',
      'The History of Office Furniture',
      'How to Design a Library',
      'The Economics of Remote Work',
    ],
    mainIdeas: [
      'Open-plan noise is best managed by matching layout to the kind of work being done.',
      'Open-plan offices always improve concentration.',
      'Acoustic panels eliminate all speech distraction.',
      'Expensive furniture guarantees a quiet office.',
    ],
  },
  {
    title: 'Why Foxes Thrive in Cities',
    text:
      'Foxes moved into cities because cities offered food, shelter and fewer predators. They are opportunistic feeders, taking insects, fruit, pet food and discarded meals, and they den under sheds and in railway embankments. Their presence divides residents: some welcome the animals, others worry about noise, mess and disease. Research suggests that urban foxes are generally wary of people and that feeding them changes behaviour more than keeping them does. Culls are expensive and often ineffective because neighbouring populations move in. The practical approach is to secure rubbish, avoid deliberate feeding and accept that an adaptable predator will live wherever conditions suit it.',
    gaps: ['opportunistic', 'wary', 'adaptable'],
    gapDistractors: [
      ['domestic', 'seasonal', 'agricultural'],
      ['curious', 'friendly', 'visible'],
      ['endangered', 'expensive', 'domestic'],
    ],
    highlights: [
      'Research suggests that urban foxes are generally wary of people and that feeding them changes behaviour more than keeping them does.',
      'The practical approach is to secure rubbish, avoid deliberate feeding and accept that an adaptable predator will live wherever conditions suit it.',
    ],
    titles: [
      'Why Foxes Thrive in Cities',
      'The History of Urban Parks',
      'How Rabies Spreads',
      'The Decline of Rural Wildlife',
    ],
    mainIdeas: [
      'Urban foxes succeed by exploiting city food and shelter, and culling is rarely effective.',
      'Urban foxes depend entirely on deliberate feeding.',
      'Culls permanently remove foxes from a city.',
      'Foxes avoid all human-modified environments.',
    ],
  },
  {
    title: 'The Hidden Accounting of Repair',
    text:
      'Whether to repair an appliance or replace it is usually framed as a personal choice, but the calculation depends on information most people do not have. A new machine may use less electricity, but manufacturing it requires energy and materials that are invisible in the shop price. A repair may be cheap, yet the spare part may be unavailable or the labour may cost more than the device is worth. Product design decides much of this: screws instead of glue, published manuals and long spare-part availability make repair possible. Policy can shift the balance through taxes, warranties and standards. The decision is therefore not simply about thrift; it is about who bears the cost of a product\'s whole life.',
    gaps: ['calculation', 'availability', 'warranties'],
    gapDistractors: [
      ['design', 'colour', 'delivery'],
      ['advertising', 'weight', 'speed'],
      ['shelves', 'lorries', 'salaries'],
    ],
    highlights: [
      'A new machine may use less electricity, but manufacturing it requires energy and materials that are invisible in the shop price.',
      'The decision is therefore not simply about thrift; it is about who bears the cost of a product\'s whole life.',
    ],
    titles: [
      'The Hidden Accounting of Repair',
      'The History of Household Appliances',
      'How Electricity Is Priced',
      'Why Consumers Prefer New Products',
    ],
    mainIdeas: [
      'Repair-versus-replace decisions depend on design and hidden lifecycle costs.',
      'A repair is always cheaper than a replacement.',
      'Manufacturing energy is included in the shop price.',
      'Product design has no influence on repairability.',
    ],
  },
  {
    title: 'Kelp Forests and the Return of Otters',
    text:
      'Kelp forests grow in cold coastal water and can disappear within a few years when conditions change. The plants attach to rock, rise towards the light and create a three-dimensional habitat for fish, crabs and sea otters. Their enemies are warm water, pollution and grazing by sea urchins. When otters are removed, urchin populations grow and strip the kelp, leaving a barren ground that persists even if the water cools. Restoration therefore sometimes begins with predator protection rather than with planting. The system shows how a small change at one level can reorganise an entire habitat, and why restoring a single species may be enough to start recovery.',
    gaps: ['habitat', 'persists', 'reorganise'],
    gapDistractors: [
      ['market', 'season', 'harvest'],
      ['returns', 'shrinks', 'moves'],
      ['measure', 'protect', 'transport'],
    ],
    highlights: [
      'When otters are removed, urchin populations grow and strip the kelp, leaving a barren ground that persists even if the water cools.',
      'The system shows how a small change at one level can reorganise an entire habitat, and why restoring a single species may be enough to start recovery.',
    ],
    titles: [
      'Kelp Forests and the Return of Otters',
      'The Biology of Seaweed',
      'How Coastal Storms Form',
      'The Economics of Fishing',
    ],
    mainIdeas: [
      'Kelp forests can shift to barren states, and predator recovery can restart them.',
      'Kelp forests are unaffected by grazing urchins.',
      'Warm water always restores kelp growth.',
      'Removing otters increases kelp cover.',
    ],
  },
  {
    title: 'Why Names Are Hard to Remember',
    text:
      'Forgetting a name is not usually a sign that memory is failing in general. Names are arbitrary labels attached to people, and they carry little meaning that would help retrieval. A face, a voice and a context are stored in rich detail, but the name is a thin link to that bundle. Retrieval also depends on attention at the moment of learning: a name heard in a noisy room may never be encoded properly. Strategies that work include repeating the name, linking it to an image and using it soon afterwards. The experience of having a name on the tip of the tongue is a retrieval failure, not evidence that the information has vanished.',
    gaps: ['arbitrary', 'retrieval', 'encoded'],
    gapDistractors: [
      ['formal', 'seasonal', 'lengthy'],
      ['storage', 'design', 'travel'],
      ['forgotten', 'printed', 'spoken'],
    ],
    highlights: [
      'A face, a voice and a context are stored in rich detail, but the name is a thin link to that bundle.',
      'The experience of having a name on the tip of the tongue is a retrieval failure, not evidence that the information has vanished.',
    ],
    titles: [
      'Why Names Are Hard to Remember',
      'The Anatomy of the Brain',
      'How to Improve Exam Scores',
      'The History of Surnames',
    ],
    mainIdeas: [
      'Names are hard to recall because they are arbitrary labels with weak retrieval cues.',
      'Forgetting a name proves that memory is declining.',
      'Names are stored with more meaning than faces.',
      'Tip-of-the-tongue states mean the memory is gone.',
    ],
  },
  {
    title: 'How Buildings Survive Earthquakes',
    text:
      'An earthquake-resistant building does not simply resist shaking; it absorbs and redirects it. Foundations can be isolated with rubber bearings that separate the structure from the ground, so the building moves more slowly than the soil. Braces and shear walls stop the frame from twisting, while carefully designed joints allow some movement without collapse. The aim is not to keep the building undamaged in a severe quake, but to keep it standing long enough for people to leave. Older buildings can be retrofitted, though the cost is high and tenants may have to move out during the work. Codes therefore balance safety against disruption, and the balance is a political choice as much as an engineering one.',
    gaps: ['isolated', 'retrofitted', 'disruption'],
    gapDistractors: [
      ['painted', 'measured', 'divided'],
      ['demolished', 'sold', 'insured'],
      ['profit', 'weather', 'traffic'],
    ],
    highlights: [
      'Foundations can be isolated with rubber bearings that separate the structure from the ground, so the building moves more slowly than the soil.',
      'Codes therefore balance safety against disruption, and the balance is a political choice as much as an engineering one.',
    ],
    titles: [
      'How Buildings Survive Earthquakes',
      'The History of City Planning',
      'Why Earthquakes Cannot Be Predicted',
      'The Strength of Concrete',
    ],
    mainIdeas: [
      'Seismic design aims to preserve life and control movement rather than prevent all damage.',
      'Earthquake-resistant buildings never suffer damage.',
      'Retrofitting is cheap and never disrupts residents.',
      'Rubber bearings make a building rigid against shaking.',
    ],
  },
  {
    title: 'The Case Against Library Fines',
    text:
      'Library fines are intended to encourage the return of books, but they can also discourage the people who need the library most. A small charge may be trivial for a wealthy reader and a reason to avoid the building for a family on a tight budget. Many libraries have replaced fines with automatic renewals and reminders, and some report that returns improve because the system is simpler. Others argue that fines protect access for everyone by ensuring that popular items circulate. The evidence is mixed, partly because libraries differ in their users and collections. The debate is a small example of a larger question: whether a public service should punish a minority in order to protect a shared resource.',
    gaps: ['renewals', 'circulate', 'punish'],
    gapDistractors: [
      ['fines', 'shelves', 'tickets'],
      ['close', 'expand', 'catalogue'],
      ['reward', 'inform', 'employ'],
    ],
    highlights: [
      'A small charge may be trivial for a wealthy reader and a reason to avoid the building for a family on a tight budget.',
      'The debate is a small example of a larger question: whether a public service should punish a minority in order to protect a shared resource.',
    ],
    titles: [
      'The Case Against Library Fines',
      'The History of Public Libraries',
      'How Books Are Catalogued',
      'Why Reading Is Declining',
    ],
    mainIdeas: [
      'Library fines may deter needy users, and alternatives can protect access without punishment.',
      'Fines are equally burdensome for every library user.',
      'Automatic renewals always reduce returns.',
      'Fines have no effect on access to popular books.',
    ],
  },
  {
    title: 'Why Fog Is Hard to Forecast',
    text:
      'Fog is difficult to forecast because it forms in a thin layer near the ground, below the resolution of many weather models. It appears when air cools to its dew point, often overnight, and when tiny particles give water vapour a surface on which to condense. Airports need warnings because visibility affects landing rates and schedules. Forecasters combine sensor readings, satellite images and local knowledge of how valleys and coasts behave. A forecast that is correct for a region can still miss the fog at one runway. The problem is therefore one of scale: the atmosphere is understood in general, but the last hundred metres are where the decisions are made.',
    gaps: ['condense', 'visibility', 'resolution'],
    gapDistractors: [
      ['evaporate', 'expand', 'dissolve'],
      ['speed', 'noise', 'traffic'],
      ['direction', 'temperature', 'pressure'],
    ],
    highlights: [
      'It appears when air cools to its dew point, often overnight, and when tiny particles give water vapour a surface on which to condense.',
      'The problem is therefore one of scale: the atmosphere is understood in general, but the last hundred metres are where the decisions are made.',
    ],
    titles: [
      'Why Fog Is Hard to Forecast',
      'The History of Aviation',
      'How Clouds Form',
      'The Science of Rainbows',
    ],
    mainIdeas: [
      'Fog forecasting is limited by the small scale at which fog forms.',
      'Fog forms high in the atmosphere where models are accurate.',
      'Visibility has no effect on airport schedules.',
      'Fog can be predicted from temperature alone.',
    ],
  },
  {
    title: 'The Logic Behind Paper Sizes',
    text:
      'The A series of paper sizes looks arbitrary until you notice the rule behind it. Each sheet has the same proportions, so folding or enlarging it preserves the shape. A0 has an area of one square metre, and each subsequent size is half the previous one. The system was designed in Europe in the early twentieth century and spread because it made printing, filing and postage easier to standardise. North America kept a different tradition, which is why a document formatted for one system often leaves awkward margins in the other. Standard sizes are a quiet form of infrastructure: invisible when they work, expensive when they do not.',
    gaps: ['proportions', 'standardise', 'infrastructure'],
    gapDistractors: [
      ['colours', 'prices', 'weights'],
      ['hide', 'delay', 'decorate'],
      ['furniture', 'weather', 'language'],
    ],
    highlights: [
      'Each sheet has the same proportions, so folding or enlarging it preserves the shape.',
      'Standard sizes are a quiet form of infrastructure: invisible when they work, expensive when they do not.',
    ],
    titles: [
      'The Logic Behind Paper Sizes',
      'The Invention of the Printing Press',
      'How Paper Is Recycled',
      'The History of Office Work',
    ],
    mainIdeas: [
      'Standard paper sizes encode a simple geometric rule that reduces friction in printing and filing.',
      'A-series paper sizes have no consistent proportions.',
      'Standard sizes are equally common in every country.',
      'Paper size has no effect on printing costs.',
    ],
  },
];

// The first sixteen passages predate the embedded-distractor format. Their
// distractors are attached here so every passage exposes the same shape and
// the generator has a single code path.
const legacyGapDistractors = [
  [['reduces', 'measures', 'replaces'], ['pressure', 'shade', 'dust'], ['construction', 'advertising', 'inspection']],
  [['absorbs', 'records', 'delays'], ['repetition', 'storage', 'imitation'], ['random', 'optional', 'temporary']],
  [['printed', 'vanished', 'multiplied'], ['exchange', 'collect', 'transport'], ['taxation', 'competition', 'regulation']],
  [['treatment', 'inspection', 'isolation'], ['sterile', 'external', 'temporary'], ['individual', 'immediate', 'accidental']],
  [['loosened', 'expanded', 'drained'], ['reservoir', 'channel', 'surface'], ['declines', 'fluctuates', 'stabilises']],
  [['combine', 'exclude', 'delay'], ['quotas', 'borders', 'budgets'], ['minorities', 'individuals', 'officials']],
  [['smooth', 'hollow', 'transparent'], ['limits', 'prices', 'routes'], ['dense', 'humid', 'visible']],
  [['stones', 'minerals', 'salt'], ['expansion', 'protection', 'irrigation'], ['taxation', 'migration', 'education']],
  [['broken', 'silent', 'written'], ['translation', 'publication', 'correction'], ['habit', 'measure', 'belief']],
  [['automatic', 'hydraulic', 'electrical'], ['material', 'colour', 'weight'], ['friction', 'balance', 'pressure']],
  [['particles', 'currents', 'surfaces'], ['minerals', 'bacteria', 'nutrients'], ['shelter', 'barrier', 'channel']],
  [['formal', 'hostile', 'temporary'], ['frequent', 'expensive', 'public'], ['social', 'rural', 'private']],
  [['target', 'surplus', 'demand'], ['absorb', 'retain', 'supply'], ['tariffs', 'grants', 'markets']],
  [['measured', 'imagined', 'reported'], ['crowded', 'distant', 'silent'], ['motivation', 'reputation', 'profit']],
  [['available', 'moderate', 'affordable'], ['general', 'seasonal', 'manual'], ['pressure', 'colour', 'weight']],
  [['prevention', 'detection', 'recovery'], ['storage', 'display', 'cataloguing'], ['emergency', 'routine', 'financial']],
];

readingPassages.slice(0, legacyGapDistractors.length).forEach((passage, index) => {
  if (!passage.gapDistractors) passage.gapDistractors = legacyGapDistractors[index];
});

// Short academic texts used only by the C-Test. Together with the passages
// above they give the C-Test pool 100 distinct texts, so no C-Test item has to
// reuse another item's text.
export const cTestPassages = [
  {
    title: 'The Standard Shipping Container',
    text:
      'The shipping container is a simple steel box, but its standard dimensions changed world trade. Before it, cargo was loaded piece by piece, which took days and employed many dockworkers. A container can move from a ship to a truck to a train without being unpacked, so the cost of handling falls sharply. Ports that adopted the box early grew; those that refused lost traffic. The container also changed cities, because warehouses moved away from old docks. Its success came less from the box itself than from an agreement on size, locks and paperwork.',
  },
  {
    title: 'Why Bread Goes Stale',
    text:
      'Bread does not dry out only because water escapes. During baking, starch granules absorb water and swell; after cooling, they slowly reorder into a firmer structure and release some of that water. This process, called retrogradation, makes the crumb feel hard even when the loaf still contains moisture. Warming the bread briefly reverses part of the change, which is why toast seems softer. Freezing stops it, while storing bread in a refrigerator speeds it up. The practical lesson is that temperature, not air alone, decides how long a loaf stays soft.',
  },
  {
    title: 'Reading the Age of a Tree',
    text:
      'Forest scientists can estimate the age of a tree without cutting it down. A small core is removed with a hollow drill, and the rings are counted under a microscope. Each ring usually marks one year of growth, but drought or injury can produce false or missing rings. The width of the rings also records climate: wide rings mean favourable years, narrow ones mean stress. The method is not perfectly precise, so researchers compare several trees in the same area. The result is a history of the forest written in wood, read without killing the tree.',
  },
  {
    title: 'How a Vacuum Flask Works',
    text:
      'A vacuum flask slows heat transfer by removing the air between two walls. Without air, conduction and convection have little material to carry energy, and a reflective coating reduces radiation. The stopper blocks warm air from escaping at the top, which is why a lost stopper matters more than a scratched body. No flask is perfect: heat still travels through the neck and the seal. The design is therefore a set of small defences rather than a single barrier. Its effectiveness depends on every part remaining intact, especially the parts that are easiest to lose.',
  },
  {
    title: 'The Waggle Dance of Honeybees',
    text:
      'Honeybees communicate the direction and distance of food with a movement called the waggle dance. The angle of the dance relative to vertical corresponds to the angle of the food relative to the sun. The duration of the waggle indicates distance, and the vigour suggests quality. The dance is performed in darkness inside the hive, so other bees follow the vibrations rather than watching a picture. Researchers have confirmed the meaning by moving feeders and observing where recruits arrive. The system shows that complex information can be encoded without language, using geometry and rhythm.',
  },
  {
    title: 'The First Public Libraries',
    text:
      'The first public libraries were not free in the modern sense. Many charged a subscription, restricted access to members or opened only to scholars. The idea that a library should serve everyone developed alongside compulsory schooling and cheap printing. Philanthropists funded buildings, but local taxes paid for staff and books. The result was a strange hybrid: a civic institution that depended on private generosity and public money at the same time. Modern debates about closures repeat the old question of who should pay for a service whose benefits are shared unevenly and appear slowly.',
  },
  {
    title: 'When a River Turns Green',
    text:
      'A river can turn green for several reasons, and the colour alone does not identify the cause. Excess nutrients may feed algae, which multiply near the surface and shade submerged plants. Copper compounds used in dyes or plumbing can produce a different green, and some harmless bacteria form green films on stones. Testing is therefore necessary before blaming pollution. The timing matters too: a bloom that appears after heavy rain may be carried from farmland, while a persistent colour near a pipe suggests a local source. Colour is a clue, not a diagnosis.',
  },
  {
    title: 'Matching a Solvent to a Stain',
    text:
      'Stains are removed by matching a solvent to the chemistry of the mark. Grease dissolves in detergent, while tannins from tea and wine respond to mild acid or oxygen bleach. Hot water can set a protein stain such as blood, because the protein changes shape and binds more tightly to the fabric. The same heat that helps remove oil may therefore ruin a shirt. Professional cleaners classify both the fibre and the stain before choosing a treatment. The rule is to identify first and act second, since an aggressive remedy can fix one problem and create another.',
  },
  {
    title: 'Why Aircraft Are De-iced',
    text:
      'Ice on a wing changes its shape and reduces the lift that keeps an aircraft in the air. Even a thin layer can matter during take-off, when the wing is working hardest. Airports therefore spray aircraft with heated fluid before departure, and the pilot must leave within a limited time. The fluid is expensive and its runoff must be collected to protect nearby water. Engineers have tested smoother coatings that shed ice, but none has replaced the procedure. The ritual on the apron is a safety measure whose cost is visible to passengers and whose benefit is invisible.',
  },
  {
    title: 'The Materials of a Cooking Pot',
    text:
      'A good cooking pot is a compromise between conducting heat and holding it. Copper conducts quickly but reacts with acidic food, so it is often lined with tin or steel. Cast iron heats slowly and retains heat well, which suits searing but makes quick changes difficult. Aluminium is light and cheap, yet it can warp and may react with certain dishes. Manufacturers combine layers of metals to get the benefits of each. The best choice therefore depends on the task, not on a single ranking of materials. A pan that is excellent for soup may be poor for a steak.',
  },
  {
    title: 'Recording an Earthquake',
    text:
      'A seismometer records ground motion with a mass that tends to stay still while the frame around it moves. The difference is amplified and written as a trace. Early instruments used a pendulum and a pen; modern ones convert motion into electrical signals. A single station can estimate distance from the arrival times of different waves, but several stations are needed to locate an earthquake precisely. The same data can reveal the structure of the Earth, because waves bend and reflect as they pass through different layers. A recording is therefore both a warning and a map.',
  },
  {
    title: 'The Visible Part of Bread Mould',
    text:
      'Mould on bread is the visible part of a fungus that grows as fine threads through the food. The green or blue surface is where spores are produced, and by the time it appears the threads may already extend deeper than the eye can see. Cutting away the moulded area is therefore unreliable, especially in soft bread. Spores travel through air and settle on surfaces, which is why bread stored in a damp, warm place spoils quickly. Dry, cool storage and clean containers slow the process. The lesson is that what is visible is only the surface of a larger organism.',
  },
  {
    title: 'Why Wine Contains Sulphites',
    text:
      'Sulphites are added to wine because they slow oxidation and suppress unwanted microbes. Without them, a wine may brown, lose freshness or continue fermenting in the bottle. The amounts used are small, but some people react to them, especially those with asthma. Labelling rules therefore require manufacturers to declare their presence above a threshold. Sulphites occur naturally during fermentation as well, so a wine labelled as containing none may still have trace amounts. The debate is a useful example of how a technical additive becomes a public concern that cannot be settled by chemistry alone.',
  },
  {
    title: 'The Invention of the Eraser',
    text:
      'The eraser was not invented with the pencil. Early writers used bread or wax to lift graphite, which often smeared the page. Rubber worked better, but it damaged paper until manufacturers learned to soften it with vegetable oils. The familiar pink eraser is a later compromise between abrasion and cleanliness. A hard eraser removes marks aggressively and can tear the sheet; a soft one preserves the paper but leaves residue. The object is therefore a small lesson in materials: effectiveness depends on matching hardness to the surface, not on applying more force.',
  },
  {
    title: 'Measuring the Height of the Sea',
    text:
      'Satellites measure sea height by timing a radar pulse as it travels to the surface and back. The result is precise to a few centimetres, but only after corrections for the satellite\'s orbit, the atmosphere and the waves. Repeated measurements reveal slow changes that a tide gauge cannot show across an entire ocean. The method has shown that sea level is not rising uniformly: some regions rise faster because of currents and shifts in the seafloor. A single number for global sea level is therefore an average that hides important local differences.',
  },
  {
    title: 'The Acoustics of a Concert Hall',
    text:
      'The acoustics of a concert hall depend on how sound reflects before it reaches the listener. Early reflections from side walls and the ceiling help the ear locate instruments and blend the orchestra. A long delay produces an echo, while too much absorption makes the room sound dead. Designers therefore model the shape of the hall and test scale models with sound. The audience also matters, because people absorb sound and change the room when seats are full. A hall is tuned for an occupied state, which is why an empty rehearsal can sound surprisingly different.',
  },
  {
    title: 'Why Leaves Change Colour',
    text:
      'Leaves change colour in autumn because the pigments that remain become visible as chlorophyll breaks down. Chlorophyll is unstable and is replaced constantly during summer; when days shorten and temperatures fall, production stops. Yellow and orange pigments were present all along but were hidden by green. Red pigments are different: many are made freshly in autumn from sugars trapped in the leaf. The timing depends on species, weather and light, so a warm, bright autumn can produce stronger reds. The display is therefore a chemical signal of the tree preparing for winter, not a simple decay.',
  },
  {
    title: 'The Cost of Attending a Conference',
    text:
      'Academic conferences are expensive to attend, and the cost is not evenly distributed. Registration, travel and accommodation may be covered by a wealthy institution but not by a student or a researcher in a poorer country. Organisers often justify fees by the cost of venues and catering, yet the largest expense is sometimes the hotel contract. Online attendance reduces travel but can weaken the informal conversations that make a conference useful. A hybrid model costs more to run and requires better technology. The debate is therefore about who gets access to the professional network, not only about the price of a ticket.',
  },
  {
    title: 'How a Vaccine Trial Is Designed',
    text:
      'A vaccine trial compares a vaccinated group with a control group that receives a placebo or an existing vaccine. Participants are assigned at random so that differences in age, health and behaviour are spread evenly. Researchers then measure how many people in each group become ill. A trial must be large enough to detect a difference and long enough to catch rare effects. Results are reviewed by independent committees before approval. The process is slow by design, because a mistake would be difficult to reverse once a product is given to millions of people.',
  },
  {
    title: 'The Structure of a Feather',
    text:
      'A feather is a lightweight structure with a strong central shaft and branches that lock together. Tiny hooks on the branches connect them into a flat surface that resists air. When the surface is disturbed, the bird can preen it back into shape. Feathers insulate, repel water and display colour, so a single structure serves several purposes. They are also expensive to produce and must be replaced regularly. The design is therefore a compromise among flight, temperature and communication, and the balance differs between species and seasons.',
  },
  {
    title: 'Why Concrete Sidewalks Crack',
    text:
      'Concrete sidewalks crack because they expand and contract with temperature and moisture. A slab that is restrained by the ground cannot move freely, so stress builds until it relieves itself as a crack. Builders control the process by cutting shallow joints at regular intervals, which encourage cracks to form in hidden lines rather than random ones. Tree roots and heavy vehicles add loads that the design may not anticipate. A crack is not always a failure; it can be a planned release. The problem begins when water enters, freezes and widens the gap.',
  },
  {
    title: 'The Slow Arrival of Zero',
    text:
      'The number zero arrived late in the history of mathematics, even though the idea of nothing is familiar. Early systems used placeholders without treating zero as a number that could be added or multiplied. Indian mathematicians developed rules for zero and for negative numbers, and the system spread through trade and translation. A symbol for nothing made written calculation much easier, because position alone could indicate value. The concept also raised awkward questions: division by zero has no answer within ordinary arithmetic. A simple mark therefore required a new set of rules.',
  },
  {
    title: 'How Fish Survive Under Ice',
    text:
      'Fish survive under frozen lakes because water behaves unusually as it cools. It becomes denser until about four degrees Celsius, then lighter as it approaches freezing. The coldest water therefore rises to the surface and freezes first, while the deeper water stays liquid and relatively warm. Ice also insulates the lake from the cold air above. Fish slow their metabolism and need less oxygen, but they can still suffocate if the ice is covered by snow and plants decay beneath it. The survival of the lake depends on a physical property that most people never notice.',
  },
  {
    title: 'How Soap Removes Grease',
    text:
      'Soap works because its molecules have two ends with different preferences. One end attaches to water, while the other attaches to oil and grease. In water, the molecules form small clusters that trap grease inside and carry it away. Without soap, oil and water separate, and rinsing removes little. Hard water reduces the effect because minerals react with soap and form a scum. Modern detergents use similar chemistry but are designed for different water conditions. The basic principle has not changed: cleaning requires a molecule that can bridge two substances that would otherwise ignore each other.',
  },
  {
    title: 'What Every Flat Map Distorts',
    text:
      'Every flat map distorts something, because a sphere cannot be flattened without stretching or tearing. A projection may preserve direction, area or distance, but not all three at once. Maps used for navigation therefore prioritise angles, while maps used for comparing countries prioritise area. The familiar world map exaggerates the size of high latitudes, which is why Greenland looks larger than it is. The distortion is not a mistake but a choice that should match the purpose. Reading a map responsibly means asking what it preserves and what it sacrifices.',
  },
  {
    title: 'How the Barcode Changed Retailing',
    text:
      'The barcode began as a way to speed up grocery checkout, but its larger effect was on data. A scanner converts a pattern of lines into a number, and that number links to a price, a stock record and a reorder system. The shop no longer needs to count every item by hand, and managers can see what sells and when. The standard had to be agreed across manufacturers and retailers before it could work, which was harder than building the scanner. The technology is therefore an example of coordination: a simple symbol became useful only when everyone used the same one.',
  },
  {
    title: 'How a Seed Decides to Sprout',
    text:
      'A seed does not sprout simply because it is placed in soil. It waits for conditions that suggest survival: enough water, a suitable temperature and, for some species, light or a period of cold. These requirements prevent a seedling from appearing during a brief warm spell in winter. The seed also carries a store of energy and a protective coat that must weaken before water can enter. Fire, digestion or weathering can break that coat in different species. Germination is therefore a decision made by chemistry, not a passive response to being buried.',
  },
  {
    title: 'The Sound of a Kettle',
    text:
      'A kettle whistle works because steam escaping through a small opening creates an unstable jet. The jet produces vibrations in the cavity, and the pitch depends on the size and shape of the opening. When the water boils, the flow of steam becomes strong enough to make the sound. A covered spout or a wider hole can silence it, which is why the whistle is not a reliable safety device. Modern kettles use a thermostat instead. The old design is a reminder that a useful signal can be an accidental property of fluid dynamics.',
  },
  {
    title: 'Restoring a Peat Bog',
    text:
      'Peat bogs store carbon because waterlogged conditions slow decay. Plants die, but instead of breaking down fully they accumulate as peat over thousands of years. Draining a bog exposes the peat to air, and microbes release the stored carbon quickly. Restoration therefore begins by blocking drains and raising the water table. The plants return slowly, and the surface may take decades to recover. A restored bog is not the same as an untouched one, but it can stop the loss. The work is unglamorous and cheap compared with the carbon it protects.',
  },
  {
    title: 'The Smell of an Old Book',
    text:
      'The smell of an old book comes from the slow breakdown of paper, glue and ink. Lignin in cheap paper releases vanillin and other compounds, which is why some volumes smell faintly of vanilla. Acids in the paper also cause yellowing and brittleness. The process is faster in warm, humid conditions and slower in cool, dry storage. Conservators therefore control temperature and humidity rather than trying to seal books away completely. The smell is a chemical signal of decay, and a pleasant one only because the decay is slow.',
  },
  {
    title: 'How Traffic Jams Move Backwards',
    text:
      'Traffic jams can form without an accident or a road closure. When one driver brakes suddenly, the car behind brakes a moment later, and the delay repeats down the line. The result is a wave that travels backwards through the queue even as the cars move forwards. A small gap left by one driver can damp the wave, while tailgating amplifies it. Variable speed limits and ramp meters try to smooth the flow before the wave grows. The problem is therefore a collective behaviour, not simply a shortage of road space.',
  },
  {
    title: 'Why Solar Panels Age',
    text:
      'Solar panels lose efficiency slowly as they age. Sunlight damages the encapsulant that protects the cells, and moisture can corrode connections. Heat accelerates both processes, so panels in hot climates may degrade faster than those in cool ones. Manufacturers guarantee a certain output after twenty or twenty-five years, but the guarantee depends on installation and maintenance. Cleaning matters in dusty regions, while shading from new trees can cut output sharply. A panel is therefore a long-lived but not permanent investment, and its performance is shaped by the place where it is installed.',
  },
  {
    title: 'The Ecology of a Cheese Rind',
    text:
      'The rind of a cheese is a living surface, not a wrapper. Moulds and bacteria grow there and influence the flavour and texture beneath. A washed rind is wiped with brine, which encourages bacteria that produce strong aromas; a natural rind is left to dry and form a crust. The environment of the aging room, including humidity and air movement, decides which organisms dominate. Some rinds are edible, while others are trimmed before sale. The boundary between protection and spoilage is therefore a matter of controlled ecology, not a simple rule.',
  },
  {
    title: 'Why Glass Is Transparent',
    text:
      'Glass is transparent because its electrons cannot absorb visible light. The energy needed to move an electron in the material is higher than the energy carried by a photon of visible light, so the light passes through. Impurities such as iron absorb some colours, which is why thick glass looks green. Glass is also amorphous: its atoms are disordered, so light is not scattered by grain boundaries as it is in a ceramic. The combination of atomic structure and electronic energy makes a solid material behave like a window.',
  },
  {
    title: 'Why Railways Share a Gauge',
    text:
      'The standard railway gauge is a width of track that spread across continents because early networks needed to connect. A single gauge allows trains to run from one company\'s line to another without unloading passengers or goods. Regions that chose a different width found themselves isolated, and changing later was expensive. The gauge was therefore a technical decision with political consequences, shaping trade routes and border crossings. Some countries still use more than one width, which requires special trains or transfers. Infrastructure standards are often invisible until they prevent something from moving.',
  },
  {
    title: 'What a Weather Balloon Measures',
    text:
      'Weather balloons carry instruments into the upper atmosphere twice a day from stations around the world. The balloon rises, expands and eventually bursts, while the instrument package falls back on a small parachute. During the flight it measures temperature, pressure, humidity and wind. These measurements are more detailed than satellite data at the same height, which is why they remain important for forecasting. The stations are coordinated internationally so that observations are taken at the same times. A simple rubber balloon therefore contributes to a global system of comparison.',
  },
  {
    title: 'The Roots of a Mangrove Forest',
    text:
      'Mangrove forests grow where salt water meets land, and their roots trap sediment that would otherwise wash into the sea. The trees tolerate salt by filtering it at the roots or storing it in leaves that later fall. Their tangled roots slow waves and provide nursery habitat for fish. Coastal developers have often removed mangroves for shrimp ponds or building land, only to find that storm damage increases. Restoration is possible but slow, because seedlings need the right tide and soil. The forest is therefore a form of coastal defence that also supports livelihoods.',
  },
  {
    title: 'The Shape of a Mental Map',
    text:
      'People navigate using mental maps that are not accurate copies of a city. They remember landmarks, routes and distances in a simplified form, and they fill gaps with assumptions. A familiar journey may feel shorter on the way home because the destination is known. When a route is blocked, the map must be revised, and the revision can take time. Researchers study these maps by asking people to draw neighbourhoods or estimate distances. The results show that memory organises space around meaning and habit rather than geometry.',
  },
  {
    title: 'The Predictability of Tidal Power',
    text:
      'Tidal energy is predictable in a way that wind and solar power are not. The tide follows the moon, so operators can forecast output years in advance. The difficulty is cost: turbines must survive salt water, strong currents and maintenance access that depends on the tide. Barrages can change estuaries and harm wildlife, while underwater turbines are less intrusive but harder to repair. Few sites have both a large tide and a suitable grid connection. The resource is therefore reliable but local, and its value depends on the alternatives available nearby.',
  },
  {
    title: 'The Compromise of Museum Lighting',
    text:
      'Museum lighting is a compromise between visibility and preservation. Light makes objects visible, but it also provides energy that damages pigments, textiles and paper. Conservators measure exposure in lux and limit the total dose over time. Some galleries use low light and long adaptation periods so that visitors can still see detail. Ultraviolet filters remove the most damaging part of the spectrum, but visible light also causes fading. A display is therefore a controlled sacrifice: the object is shown, but less brightly and for less time than a shop window would allow.',
  },
  {
    title: 'The Invention of the Ballpoint Pen',
    text:
      'The ballpoint pen replaced the fountain pen because it solved a messy problem. A tiny ball at the tip rolls ink onto the paper and seals the reservoir when the pen is upright. The first reliable versions needed thick, quick-drying ink, which took decades to develop. Soldiers and pilots adopted the pen during the Second World War because it did not leak at altitude. Manufacturers then cut the price and the disposable pen became ordinary. The design is a small example of how a product succeeds when chemistry, machining and distribution improve together rather than one at a time.',
  },
  {
    title: 'Why Icebergs Float',
    text:
      'An iceberg floats because ice is less dense than the water around it. When water freezes, its molecules arrange into a structure with more empty space, so the solid takes up more volume than the liquid. Only about a tenth of an iceberg shows above the surface, which is why ships cannot judge its size from the visible part. Melting ice also cools the surrounding water and changes local currents. The hidden mass is the reason icebergs are tracked by radar and satellite rather than by eye. What looks like a small white block may extend far below the hull.',
  },
  {
    title: 'The Economics of Bike Sharing',
    text:
      'Bike-sharing schemes are often justified as public transport, but their finances are unusual. The bicycles are expensive to buy, redistribute and repair, and users pay only a small fraction of the cost. Cities subsidise the service because it reduces short car trips and connects people to stations. Operators, meanwhile, need dense docking stations to make the system convenient, which creates pressure to use public space. Schemes that rely on advertising or venture capital have collapsed when the money ran out. The model works best when the public benefit is defined clearly and the contract assigns responsibility for abandoned bikes.',
  },
  {
    title: 'How a Magnetic Compass Works',
    text:
      'A magnetic compass works because a light needle aligns itself with the Earth\'s magnetic field. The needle does not point to the geographic North Pole; it points to the magnetic pole, and the difference, called declination, varies by location and changes slowly over time. Navigators therefore use local charts to correct their bearing. Metal objects and electrical equipment can distort the field nearby, which is why a compass is read away from the engine or a laptop. The instrument is simple, but using it well requires knowing what it actually measures.',
  },
  {
    title: 'The Biology of Earthworms',
    text:
      'Earthworms are not native to every soil where they are found, and their effect depends on the ecosystem. In gardens and farmland they mix organic matter into the soil, improving drainage and making nutrients available to plants. In some northern forests, however, they consume the leaf litter that native plants and insects depend on, and the forest floor changes. The animals spread slowly on their own but travel quickly in soil carried by people or machines. Whether a worm is helpful or harmful is therefore a question about the place, not about the species in general.',
  },
  {
    title: 'The Microbiology of Yogurt',
    text:
      'Yogurt is made when bacteria ferment lactose, the sugar in milk, into lactic acid. The acid lowers the pH, which makes the milk proteins coagulate and gives the product its thickness and tang. Two cultures are commonly used together: one produces acid quickly, while the other contributes flavour and texture. Heat treatment after fermentation stops the process and extends shelf life, but it also kills the live cultures that some consumers want. The choice between long life and live bacteria is therefore a choice about what the product is for.',
  },
  {
    title: 'The History of the Passenger Elevator',
    text:
      'The passenger elevator became acceptable only after a reliable brake was invented. Before that, lifts were used for freight, and few people trusted a rope in a tall building. The safety brake stopped the car if the cable failed, and its public demonstration helped change expectations. Elevators then made tall buildings practical, because owners could rent upper floors that had previously been unattractive. The device also changed urban land values and the shape of hotels. A technical fix to a fear therefore reshaped the skyline, not merely the machine.',
  },
  {
    title: 'How Microphones Capture Sound',
    text:
      'A microphone converts changes in air pressure into an electrical signal. A diaphragm moves when sound waves reach it, and the movement is transformed by a magnet and coil, by a charged capacitor or by a piezoelectric material. Each method responds differently to loudness and frequency, which is why studios keep several microphones. A microphone placed too close captures breath and rumble; one placed too far captures the room instead of the voice. The device does not hear like an ear, so recording is always a set of compromises about distance and direction.',
  },
  {
    title: 'The Ecology of a Window Box',
    text:
      'A window box is a small habitat with unusual conditions. It dries out faster than a garden bed, heats up in sun and receives pollution from the street below. Plants that survive there often have thick leaves or deep roots, and a few species become dominant. Insects arrive with the wind, and birds visit for seeds and water. The box can support a surprising amount of life if it is planted densely and watered consistently. It is also a reminder that urban ecology is shaped by maintenance, not only by the plants someone chooses.',
  },
  {
    title: 'Why Coffee Tastes Sour',
    text:
      'Coffee can taste sour when it is under-extracted or made from beans that were picked too early. Under-extraction leaves acids in the cup without the sweetness and body that balance them, which is why the same beans taste different when the grind is coarser. Roasting also changes the acids: a light roast keeps more of them, while a dark roast creates bitter compounds. Water temperature and contact time decide how much is dissolved. Sourness is therefore a signal about the process, not necessarily a defect in the bean.',
  },
  {
    title: 'The Mathematics of Compound Interest',
    text:
      'Compound interest grows a balance because interest is added to the principal and then earns interest itself. The effect is small at first and large over long periods, which is why time matters more than a small difference in rate. A loan works the same way in reverse: unpaid interest increases the amount on which the next charge is calculated. The rule of seventy-two is a rough way to estimate doubling time by dividing seventy-two by the annual percentage rate. The mathematics is simple, but the consequences are easy to underestimate.',
  },
  {
    title: 'How Airports Assign Runways',
    text:
      'Airports assign runways by matching the wind to the direction of the strip. Aircraft take off and land into the wind because it increases lift at a lower ground speed. A runway is numbered by its compass direction, so a strip pointing roughly north is called 36, and the opposite end is 18. When the wind changes, controllers may switch the active runway, which requires new approach paths and more noise for different neighbourhoods. The choice is therefore a balance among safety, capacity and the complaints of people living under the flight path.',
  },
  {
    title: 'The Chemistry of Film Photography',
    text:
      'Film photography depends on tiny crystals of silver halide suspended in gelatin. Light changes the crystals in a way that is invisible until the film is developed, when a chemical reaction turns exposed grains into metallic silver. The image is then fixed so that the remaining crystals no longer react to light. Colour film adds layers that respond to different wavelengths, and each layer must be developed in step with the others. The process is a chain of controlled chemical steps, and a small error at any stage can ruin the negative.',
  },
  {
    title: 'Why Deserts Are Cold at Night',
    text:
      'Deserts can be extremely hot during the day and cold at night because dry air holds little water vapour. Water vapour traps heat that would otherwise escape from the ground, so a humid place cools slowly after sunset. In a desert, the clear sky allows that heat to radiate away quickly. Sand also heats and cools faster than soil with vegetation. The result is a large swing between day and night that shapes how plants and animals survive. The same dryness that makes the days hot makes the nights cold.',
  },
  {
    title: 'The Origins of the Modern Dictionary',
    text:
      'The modern dictionary was shaped by the idea that a language could be described systematically. Early word lists explained difficult terms, but later editors tried to cover ordinary vocabulary and to show how words were used. That required reading thousands of texts and recording examples on slips of paper. The work was expensive and never finished, because languages change while the book is being printed. A dictionary is therefore a snapshot with a date, not a permanent rule book, even when readers treat it as one.',
  },
  {
    title: 'How a Refrigerator Cools Food',
    text:
      'A refrigerator cools food by moving heat from the inside to the outside. A refrigerant evaporates in a coil inside the cabinet, absorbing heat, and is then compressed and condensed outside, where it releases that heat. The cycle requires energy, and its efficiency depends on the temperature difference between the kitchen and the food. A fridge that is too full or has a damaged seal works harder for the same result. The appliance does not create cold; it simply moves heat, which is why the back of the fridge feels warm.',
  },
  {
    title: 'The Physics of a Bicycle Bell',
    text:
      'A bicycle bell produces a sharp sound with a simple mechanism. A spring-loaded striker hits a metal dome, and the dome vibrates at a frequency that carries well through traffic. The shape matters more than the force: a flat plate would make a duller sound and lose energy quickly. The bell is designed to be heard by pedestrians and drivers without being confused with a car horn. Its effectiveness depends on timing as much as volume, because a warning that arrives too late is useless.',
  },
  {
    title: 'Why Mountains Have Snowlines',
    text:
      'The snowline is the height above which snow survives through the summer. It varies with latitude, aspect and the amount of snowfall, so two mountains at the same latitude can have very different snowlines. A slope facing away from the sun stays cooler and may keep snow at a lower elevation. Wind also moves snow from exposed ridges into sheltered hollows. The line is therefore not a fixed contour but a seasonal boundary that shifts with weather. Changes in its height are one of the clearest signals of a warming climate.',
  },
  {
    title: 'The Design of a Wheelchair Ramp',
    text:
      'A wheelchair ramp seems simple, but its slope determines whether it is usable. A gentle gradient requires a long run, which is expensive in a city where space is scarce. A steep ramp is shorter but demands more strength and is dangerous in rain or for someone with limited grip. Landings are needed at intervals so that a user can stop and rest, and a level platform at the top prevents the chair from rolling back. The design is therefore a negotiation between land, cost and dignity, not a decorative addition to a building.',
  },
  {
    title: 'How Aluminium Cans Are Recycled',
    text:
      'Aluminium cans are recycled more efficiently than most packaging because the metal can be melted and reformed without losing its quality. Recycling saves the large amount of electricity needed to extract aluminium from ore, which is why the financial case is strong. The difficulty is collection: cans must be separated from other waste and transported to a mill. Contamination by steel or plastic reduces the value of a load. A deposit scheme can improve the return rate, but it also adds a step for consumers. The material is highly recoverable; the system around it decides how often that happens.',
  },
];
