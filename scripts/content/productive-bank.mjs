/**
 * Curated statements and scenarios for the productive-skill bank.
 *
 * Each statement becomes a writing sample (discussion + opinion) and a
 * speaking sample; the read-then-speak and interactive tasks use their own
 * scenarios. Dictations are complete sentences across A2–C2.
 */

export const statements = [
  'University education should be funded entirely by the state and free for every student.',
  'Artificial intelligence should be a compulsory subject in secondary school.',
  'Students should take a gap year before starting university.',
  'Online learning can replace most traditional classroom teaching.',
  'Standardised tests are a fair way to select university applicants.',
  'Social media does more harm than good to young people.',
  'Companies should allow employees to work remotely by default.',
  'Individuals, not governments, are responsible for fighting climate change.',
  'Governments should spend more on space exploration than on social housing.',
  'Automation will create more jobs than it destroys.',
  'Public safety is more important than personal privacy.',
  'Every citizen should receive an unconditional basic income.',
  'Cities should ban private cars from their centres.',
  'Physical education should be a compulsory part of every school year.',
  'Public money should fund museums and theatres rather than professional sport.',
  'Young people should be required to volunteer in their community.',
  'Fast fashion should be taxed to reduce its environmental impact.',
  'Governments should discourage meat consumption through pricing.',
  'Nuclear energy is the most realistic solution to the climate crisis.',
  'Smart cities improve the quality of life for everyone who lives in them.',
  'Learning a foreign language should start in primary school.',
  'Printed textbooks should be replaced by digital materials in schools.',
  'School uniforms reduce inequality among students.',
  'Homework should be limited to thirty minutes a day.',
  'Governments should equalise funding between rich and poor schools.',
  'Studying abroad should be affordable for students from low-income families.',
  'Scientific research should prioritise public health over defence.',
  'Social media platforms should be regulated like traditional publishers.',
  'Lifelong learning is now more important than a university degree.',
  'Student debt should be cancelled for graduates who work in public services.',
  'Advertising aimed at children should be banned.',
  'Companies should be legally responsible for the environmental cost of their products.',
  'Governments should invest in high-speed rail instead of new airports.',
  'Cities should require new buildings to include green roofs.',
  'Employers should not be allowed to ask for social media passwords.',
  'University rankings distort the priorities of higher education.',
  'Team sports teach skills that academic subjects cannot.',
  'Museums should return cultural objects to their countries of origin.',
  'Governments should fund basic research even when its benefits are uncertain.',
  'A four-day working week would improve both productivity and well-being.',
];

export const readThenSpeak = [
  {
    topic: 'Urban green spaces',
    prompt: 'Read the statement and speak about the role of parks in a modern city.',
    hints: ['Why parks matter for health', 'Who pays for them', 'How to keep them safe'],
  },
  {
    topic: 'Remote work and cities',
    prompt: 'Read the statement and speak about how remote work changes city life.',
    hints: ['Commuting', 'Local businesses', 'Housing demand'],
  },
  {
    topic: 'Artificial intelligence in medicine',
    prompt: 'Read the statement and speak about AI-assisted diagnosis.',
    hints: ['Accuracy', 'Patient trust', 'Responsibility for mistakes'],
  },
  {
    topic: 'Plastic waste',
    prompt: 'Read the statement and speak about reducing single-use plastic.',
    hints: ['Alternatives', 'Consumer habits', 'Regulation'],
  },
  {
    topic: 'University tuition',
    prompt: 'Read the statement and speak about who should pay for higher education.',
    hints: ['Public benefit', 'Fairness', 'Graduate taxes'],
  },
  {
    topic: 'Screen time for children',
    prompt: 'Read the statement and speak about limits on children’s screen time.',
    hints: ['Learning benefits', 'Sleep and attention', 'Parental control'],
  },
  {
    topic: 'Public transport',
    prompt: 'Read the statement and speak about making public transport the first choice.',
    hints: ['Cost', 'Reliability', 'Safety'],
  },
  {
    topic: 'Food waste',
    prompt: 'Read the statement and speak about reducing food waste in cities.',
    hints: ['Supermarkets', 'Households', 'Food banks'],
  },
  {
    topic: 'Cycling infrastructure',
    prompt: 'Read the statement and speak about building safe cycle lanes.',
    hints: ['Safety', 'Weather', 'Business deliveries'],
  },
  {
    topic: 'Language learning',
    prompt: 'Read the statement and speak about the best age to start learning a language.',
    hints: ['Pronunciation', 'Motivation', 'School curriculum'],
  },
  {
    topic: 'Volunteering',
    prompt: 'Read the statement and speak about compulsory volunteering for teenagers.',
    hints: ['Skills gained', 'Free choice', 'Community impact'],
  },
  {
    topic: 'Scientific funding',
    prompt: 'Read the statement and speak about how governments should choose research to fund.',
    hints: ['Public health', 'Basic science', 'Commercial applications'],
  },
  {
    topic: 'Tourism',
    prompt: 'Read the statement and speak about managing overtourism in popular cities.',
    hints: ['Local residents', 'Revenue', 'Seasonality'],
  },
  {
    topic: 'Online privacy',
    prompt: 'Read the statement and speak about data collection by technology companies.',
    hints: ['Consent', 'Security', 'Competition'],
  },
  {
    topic: 'Sports and health',
    prompt: 'Read the statement and speak about encouraging adults to exercise regularly.',
    hints: ['Workplace programmes', 'Access to facilities', 'Habits'],
  },
  {
    topic: 'Cultural heritage',
    prompt: 'Read the statement and speak about protecting historic city centres.',
    hints: ['Housing', 'Tourism', 'Renovation costs'],
  },
];

export const interactiveSpeaking = [
  {
    scenario: 'You are talking to your academic advisor about your study plan.',
    prompt: 'Explain why you want to change one of your elective courses next term.',
    hints: ['Your current workload', 'The skills you need', 'How you will catch up'],
  },
  {
    scenario: 'You are in a seminar on public health.',
    prompt: 'Suggest one practical way local government could encourage healthier eating.',
    hints: ['The target group', 'The cost', 'How success would be measured'],
  },
  {
    scenario: 'You are discussing a group project with classmates.',
    prompt: 'Propose how the team should divide the work and meet the deadline.',
    hints: ['Strengths of each member', 'Timeline', 'Quality control'],
  },
  {
    scenario: 'You are at a university interview for a scholarship.',
    prompt: 'Explain what you would contribute to the university community.',
    hints: ['Academic interests', 'Activities', 'Leadership experience'],
  },
  {
    scenario: 'You are speaking with a librarian about research sources.',
    prompt: 'Ask for help finding reliable sources for an essay on climate policy.',
    hints: ['The topic', 'The type of sources', 'The deadline'],
  },
  {
    scenario: 'You are presenting a proposal to a student society.',
    prompt: 'Suggest an event that would attract new members and explain how to organise it.',
    hints: ['The audience', 'Budget', 'Promotion'],
  },
  {
    scenario: 'You are discussing an internship with a recruiter.',
    prompt: 'Explain why your background fits the role and what you want to learn.',
    hints: ['Relevant skills', 'A concrete example', 'Your goals'],
  },
  {
    scenario: 'You are in a seminar debating remote work.',
    prompt: 'Argue for or against a four-day working week and respond to one objection.',
    hints: ['Productivity', 'Well-being', 'Customer expectations'],
  },
  {
    scenario: 'You are speaking to a landlord about a problem in your flat.',
    prompt: 'Describe the problem, its impact and what you would like to happen.',
    hints: ['When it started', 'Evidence', 'A reasonable request'],
  },
  {
    scenario: 'You are at a conference and meet a researcher in your field.',
    prompt: 'Introduce your own project and ask two questions about their work.',
    hints: ['Your question', 'Method', 'Possible collaboration'],
  },
  {
    scenario: 'You are discussing a course change with a programme director.',
    prompt: 'Explain the difficulty and propose a workable solution.',
    hints: ['The specific problem', 'Options you considered', 'Support you need'],
  },
  {
    scenario: 'You are in a job interview for a part-time campus role.',
    prompt: 'Describe a time you solved a problem under time pressure.',
    hints: ['Situation', 'Action', 'Result'],
  },
  {
    scenario: 'You are presenting research findings to a seminar.',
    prompt: 'Summarise your main finding and explain one limitation of the study.',
    hints: ['The method', 'The result', 'What you would change'],
  },
  {
    scenario: 'You are discussing a city transport plan with a local official.',
    prompt: 'Recommend one change and explain who benefits and who pays.',
    hints: ['Congestion', 'Cost', 'Accessibility'],
  },
  {
    scenario: 'You are speaking with a tutor about a low mark on an essay.',
    prompt: 'Ask for specific feedback and explain how you plan to improve.',
    hints: ['What you expected', 'The rubric', 'Your next draft'],
  },
  {
    scenario: 'You are in a seminar on media and democracy.',
    prompt: 'Explain whether social platforms should be regulated and why.',
    hints: ['Free speech', 'Misinformation', 'Enforcement'],
  },
];

export const interactiveWriting = [
  {
    part1: 'Some students prefer to study alone, while others learn better in groups. Discuss both approaches.',
    part2: 'Which approach would you choose for a difficult exam next month, and why?',
  },
  {
    part1: 'Many cities are limiting car use in the centre. Explain the reasons and the possible effects.',
    part2: 'Would you support such a policy in your city? Give one concrete reason.',
  },
  {
    part1: 'Universities increasingly offer online degrees. Discuss the advantages and disadvantages.',
    part2: 'Would you enrol in a fully online degree? Explain your choice.',
  },
  {
    part1: 'Some employers value experience more than formal qualifications. Discuss.',
    part2: 'What would you advise a school leaver who cannot decide between work and university?',
  },
  {
    part1: 'Governments are considering taxing sugary drinks. Explain the arguments for and against.',
    part2: 'Would such a tax change your own habits? Why or why not?',
  },
  {
    part1: 'Artificial intelligence is increasingly used to grade student work. Discuss the implications.',
    part2: 'Would you trust an AI grade for an important essay? Explain.',
  },
  {
    part1: 'Many people move abroad for work. Describe the benefits and the difficulties.',
    part2: 'Would you accept a job in another country? Give one reason.',
  },
  {
    part1: 'Some schools have replaced textbooks with tablets. Discuss the advantages and risks.',
    part2: 'Which would you prefer for your own studies, and why?',
  },
  {
    part1: 'Cities are investing in cycle lanes instead of new roads. Explain the trade-offs.',
    part2: 'What would make you choose a bicycle over a car for daily travel?',
  },
  {
    part1: 'Social media influencers advertise products to young audiences. Discuss the ethical issues.',
    part2: 'Should such advertising be restricted? Give one practical rule.',
  },
  {
    part1: 'Some countries require young people to complete a year of public service. Discuss.',
    part2: 'Would you support such a requirement? Explain briefly.',
  },
  {
    part1: 'Remote work has changed where people live. Describe the positive and negative effects.',
    part2: 'Would you move to a smaller town if you could work remotely? Why?',
  },
  {
    part1: 'Many universities now accept applications without standardised test scores. Discuss.',
    part2: 'Is a test score a fair measure of potential? Explain your view.',
  },
  {
    part1: 'Fast fashion is cheap but has environmental costs. Discuss possible solutions.',
    part2: 'What would make you buy fewer clothes? Give a concrete example.',
  },
  {
    part1: 'Some people believe museums should be free for everyone. Discuss.',
    part2: 'Would you pay for a museum ticket? Explain your reasoning.',
  },
  {
    part1: 'Automation may replace many routine jobs. Describe the risks and opportunities.',
    part2: 'Which skill would you develop to stay employable? Why?',
  },
];

export const dictationSentences = {
  A2: [
    'The students meet in the library every Tuesday afternoon.',
    'My brother works in a small shop near the station.',
    'We usually walk to school when the weather is good.',
    'She left her umbrella on the bus this morning.',
    'The museum is free on the first Sunday of every month.',
    'They are planning a short trip to the mountains in June.',
    'I need to buy a new notebook before the lesson starts.',
    'The café closes at nine in the evening.',
    'Our teacher gave us two weeks to finish the project.',
    'He takes the train to work because it is faster.',
  ],
  B1: [
    'The city council has approved a new plan to reduce traffic in the centre.',
    'Students who live on campus can use the sports facilities for free.',
    'The lecture was recorded and uploaded to the course website.',
    'Many small businesses are struggling because of rising energy costs.',
    'The research team collected data from more than five hundred participants.',
    'Local volunteers cleaned the park and planted twenty new trees.',
    'The library extended its opening hours during the exam period.',
    'Applicants must submit their documents before the end of the month.',
    'The workshop will cover basic methods of academic writing.',
    'Public transport is cheaper than driving, especially for students.',
  ],
  B2: [
    'The study found a strong correlation between sleep quality and academic performance.',
    'Researchers argue that early intervention can prevent many long-term health problems.',
    'The report highlights the need for clearer guidelines on data protection.',
    'Several factors contributed to the rapid growth of the online education market.',
    'The committee will evaluate the proposal against three main criteria.',
    'Participants were asked to describe their experience in a short written response.',
    'The new policy aims to reduce emissions without raising energy prices.',
    'The lecture focused on the economic consequences of automation.',
    'The data suggest that demand for flexible working arrangements continues to rise.',
    'The university has invested heavily in laboratory equipment and research staff.',
  ],
  C1: [
    'The findings challenge the widely held assumption that economic growth automatically reduces inequality.',
    'Policymakers must reconcile short-term political pressures with long-term environmental commitments.',
    'The author provides a compelling critique of the methodology used in earlier studies.',
    'The committee’s conclusions were based on a comprehensive review of the available evidence.',
    'Substantial investment in public transport is essential to reduce dependence on private vehicles.',
    'The report acknowledges the limitations of the data and calls for further investigation.',
    'The proposal has provoked considerable controversy among researchers and practitioners alike.',
    'A coherent strategy requires coordination between local authorities and national agencies.',
    'The study’s findings are consistent with the hypothesis that early exposure improves retention.',
    'The implications for educational policy are significant and deserve careful consideration.',
  ],
  C2: [
    'The discrepancy between the reported figures and the audited accounts remains unexplained.',
    'His argument is cogent, although it rests on a somewhat contentious premise.',
    'The legislation was ostensibly designed to protect consumers, yet it primarily benefited incumbents.',
    'The committee’s decision was perfunctory and failed to address the underlying concerns.',
    'Such idiosyncratic behaviour is difficult to reconcile with the standard economic model.',
    'The evidence, while suggestive, is too equivocal to support a definitive conclusion.',
    'The reforms may inadvertently exacerbate the very inequalities they were intended to remedy.',
    'Her analysis juxtaposes historical data with contemporary case studies.',
    'The phenomenon is a quintessential example of how incentives shape institutional behaviour.',
    'The findings vindicate the scepticism expressed by earlier critics of the programme.',
  ],
};
