// Spoken interaction content for the listening and speaking banks.
//
// Every dialogue is original. The generator rotates the option order (so the
// correct index changes) and the summary prompt, producing several tasks from
// one conversation without changing what is being tested.

export const listeningDialogues = [
  {
    scenario: 'You are an undergraduate meeting your biology professor during office hours to discuss an extension on a research assignment because of illness.',
    turns: [
      { speaker: 'Professor Hayes', audio: 'Come in! How can I help you today with your final project?', correct: 'Hello Professor. I was ill with the flu this week and would like to request a short extension.', wrong: ['I wanted to ask why the cafeteria was closed today.', 'Yes, I brought my umbrella because it was raining heavily.', 'I do not really like reading textbooks in the evening.'] },
      { speaker: 'Professor Hayes', audio: 'I am sorry to hear you were unwell. How many additional days do you realistically need?', correct: 'Three days would be enough to finish the bibliography and edit the final draft.', wrong: ['The weather was much better yesterday than today.', 'No, I did not receive any emails from other students.', 'I think I will probably graduate in two years.'] },
      { speaker: 'Professor Hayes', audio: 'That seems fair. Please send the clinic note to the departmental portal by Friday.', correct: 'Understood. I will upload the documentation today and submit the paper by Thursday night.', wrong: ['Where is the library located on campus?', 'Why do other classes have different exams?', 'I already had lunch, so I do not need anything else.'] },
    ],
    summaries: [
      'Write a 3-sentence summary of the conversation with the professor: the reason for the visit, the agreement, and your next step.',
      'Summarise in 35-65 words why you visited the professor, what was agreed, and what you must submit.',
    ],
  },
  {
    scenario: 'You are consulting an academic advisor about switching your major from economics to computer science in your second year.',
    turns: [
      { speaker: 'Advisor Martinez', audio: 'Good afternoon! What brings you into the advising centre today?', correct: 'Good afternoon. I am considering switching to computer science and want to check which credits transfer.', wrong: ['I lost my student card in the library yesterday.', 'I need directions to the campus bookstore.', 'The tuition fees were already paid by my bank last week.'] },
      { speaker: 'Advisor Martinez', audio: 'Have you completed the calculus and introductory programming sequences?', correct: 'I finished Calculus I and II with high marks, but I still need to take an introductory programming course.', wrong: ['No, I have never played intramural basketball.', 'I usually eat lunch around noon on weekdays.', 'Calculus is taught on the third floor of the science hall.'] },
      { speaker: 'Advisor Martinez', audio: 'If you take Programming I over the summer, you can still graduate in four years.', correct: 'Thank you. I will submit the summer registration petition today.', wrong: ['The library closes at ten on Friday nights.', 'I do not plan to take any courses during my degree.', 'My roommate is also an economics student.'] },
    ],
    summaries: [
      'In 35-65 words, summarise why you met the advisor, the prerequisite advice, and your next step.',
      'Write a short summary of the advising meeting: your request, the advisor\u2019s recommendation, and the action you agreed to take.',
    ],
  },
  {
    scenario: 'You are asking a subject librarian for help finding sources for a literature review on urban heat.',
    turns: [
      { speaker: 'Librarian Chen', audio: 'Welcome. What topic are you researching this semester?', correct: 'I am writing a literature review on urban heat islands and need recent peer-reviewed studies.', wrong: ['I would like to renew my gym membership.', 'Do you know when the cafeteria opens?', 'I am looking for a quiet place to sleep.'] },
      { speaker: 'Librarian Chen', audio: 'Should I limit the search to the last five years, or include classic papers as well?', correct: 'Please include both, but prioritise studies published in the last five years.', wrong: ['I only read novels in my free time.', 'The printer on the second floor is broken.', 'I have never used a database before.'] },
      { speaker: 'Librarian Chen', audio: 'I will send you a list of databases and a short guide to citation management.', correct: 'That would be very helpful. Could you also show me how to export the references?', wrong: ['I think the weather will improve tomorrow.', 'My brother works in a different library.', 'No, I do not need any help at all.'] },
    ],
    summaries: [
      'Summarise the research request, the librarian\u2019s search advice, and the follow-up you asked for.',
      'In 35-65 words, describe what you needed from the librarian and what support was offered.',
    ],
  },
  {
    scenario: 'You are attending a laboratory safety briefing before your first chemistry practical.',
    turns: [
      { speaker: 'Dr Okafor', audio: 'Before we enter the lab, tell me what you would do if a chemical splashed on your arm.', correct: 'I would rinse the area under running water for at least fifteen minutes and tell the supervisor immediately.', wrong: ['I would continue the experiment and clean it later.', 'I would use a paper towel and keep working.', 'I would leave the building without telling anyone.'] },
      { speaker: 'Dr Okafor', audio: 'Good. Where are the eyewash stations and the fire blanket located?', correct: 'The eyewash station is by the main sink and the fire blanket is next to the emergency exit.', wrong: ['I think they are in the cafeteria.', 'I have not looked for them yet.', 'They are probably in the basement.'] },
      { speaker: 'Dr Okafor', audio: 'One more thing: when should goggles be worn?', correct: 'At all times while anyone in the room is handling chemicals or glassware.', wrong: ['Only when I am being photographed.', 'Only during the first five minutes.', 'Goggles are optional if I wear glasses.'] },
    ],
    summaries: [
      'Write a 3-sentence summary of the safety briefing: the spill procedure, equipment locations, and the goggles rule.',
      'Summarise the key safety rules you were given before entering the laboratory.',
    ],
  },
  {
    scenario: 'You are interviewing for a summer internship in a data analytics team.',
    turns: [
      { speaker: 'Ms Ivanova', audio: 'Tell me about a project where you turned data into a recommendation.', correct: 'In a course project I analysed survey responses and recommended which library services to extend; the library adopted two of them.', wrong: ['I have never worked with data before.', 'My favourite subject is medieval history.', 'I usually work alone and avoid recommendations.'] },
      { speaker: 'Ms Ivanova', audio: 'How do you check that your analysis is reliable?', correct: 'I validate the data source, test the result on a subset, and ask a colleague to review the code.', wrong: ['I assume the first result is correct.', 'I only use charts that look attractive.', 'I delete outliers until the numbers agree.'] },
      { speaker: 'Ms Ivanova', audio: 'What would you like to learn during the internship?', correct: 'I would like to learn how your team moves from a prototype to a production dashboard.', wrong: ['I mainly want a certificate for my CV.', 'I would prefer not to be given real tasks.', 'I have no questions about the role.'] },
    ],
    summaries: [
      'Summarise the interview: the project you described, how you validate analysis, and what you want to learn.',
      'In 35-65 words, describe the candidate\u2019s experience and goals as presented in the interview.',
    ],
  },
  {
    scenario: 'You are mediating a disagreement in your group project about missed deadlines.',
    turns: [
      { speaker: 'Sam', audio: 'I think we should tell the tutor that the report will be late.', correct: 'Before we do that, let us agree which sections are missing and whether we can finish them by Friday.', wrong: ['I do not care about the deadline.', 'Let us blame the tutor for the schedule.', 'We should stop meeting altogether.'] },
      { speaker: 'Priya', audio: 'I can finish the literature section if someone else takes the data analysis.', correct: 'I will take the data analysis and send you both a draft by Wednesday evening.', wrong: ['That is not my responsibility.', 'I have not read the brief yet.', 'Let us postpone the decision indefinitely.'] },
      { speaker: 'Sam', audio: 'Should we still tell the tutor about the delay?', correct: 'Yes, but with a clear plan and a realistic date rather than an apology alone.', wrong: ['No, we should hide it.', 'We can decide after the deadline.', 'The tutor will not notice.'] },
    ],
    summaries: [
      'Summarise the conflict, the division of work you agreed, and how you will inform the tutor.',
      'In 35-65 words, explain how the group resolved the deadline problem.',
    ],
  },
  {
    scenario: 'You are at the housing office asking about a problem with your student residence.',
    turns: [
      { speaker: 'Mr Dubois', audio: 'How can I help you today?', correct: 'The heating in my room has not worked for four days and the temperature is below the legal minimum.', wrong: ['I would like to book a holiday.', 'I am looking for a new roommate.', 'The library is too quiet in the morning.'] },
      { speaker: 'Mr Dubois', audio: 'Have you reported it to the building manager?', correct: 'Yes, I reported it on Monday and again yesterday, but nobody has come to repair it.', wrong: ['No, I did not know there was a manager.', 'I prefer to fix it myself.', 'I have not checked whether it is broken.'] },
      { speaker: 'Mr Dubois', audio: 'I will send a technician tomorrow morning. Would a temporary heater help tonight?', correct: 'Yes, please. A temporary heater tonight would be very helpful.', wrong: ['No, I enjoy the cold.', 'I would rather wait another week.', 'I do not need anything.'] },
    ],
    summaries: [
      'Summarise the housing problem, what you had already reported, and the solution offered.',
      'In 35-65 words, describe the complaint and the arrangement made with the housing office.',
    ],
  },
  {
    scenario: 'You are visiting the writing centre to get feedback on the introduction of an academic essay.',
    turns: [
      { speaker: 'Tutor Blake', audio: 'What would you like me to focus on in this draft?', correct: 'I would like help making my thesis statement clearer and connecting it to the evidence in the next paragraph.', wrong: ['Please correct every grammar mistake for me.', 'I only need you to print the document.', 'I do not want any feedback today.'] },
      { speaker: 'Tutor Blake', audio: 'Your thesis is broad. What is the one claim you want the reader to accept?', correct: 'That remote work reduces urban congestion only when public transport is also improved.', wrong: ['That remote work is an interesting topic.', 'That cities are usually crowded.', 'That I have written many essays before.'] },
      { speaker: 'Tutor Blake', audio: 'Good. Shall we rewrite the sentence together and then look at the transition?', correct: 'Yes, let us rewrite it now and check that the next paragraph supports the claim.', wrong: ['No, I would rather start a different essay.', 'I think the current version is perfect.', 'I have to leave immediately.'] },
    ],
    summaries: [
      'Summarise the feedback session: the focus you requested, the revised claim, and the next step.',
      'In 35-65 words, describe what the writing tutor helped you improve.',
    ],
  },
  {
    scenario: 'You are talking to a career adviser about applying for graduate schemes.',
    turns: [
      { speaker: 'Adviser Novak', audio: 'Which sector are you targeting for your applications?', correct: 'I am targeting environmental consulting, especially roles that combine data analysis and field work.', wrong: ['I have not thought about it at all.', 'I only want to work from home.', 'I would accept any job anywhere.'] },
      { speaker: 'Adviser Novak', audio: 'Do you have relevant experience outside your degree?', correct: 'I volunteered for a river monitoring project last summer and produced the monthly water-quality report.', wrong: ['No, I have never done anything outside class.', 'I prefer not to discuss my experience.', 'I only have retail experience.'] },
      { speaker: 'Adviser Novak', audio: 'I can review your CV next week. What would you like me to check first?', correct: 'Please check whether my project results are described clearly enough for a non-specialist recruiter.', wrong: ['Please write the whole CV for me.', 'I do not need a review.', 'Just tell me the salary.'] },
    ],
    summaries: [
      'Summarise the career conversation: the target sector, relevant experience, and the CV review request.',
      'In 35-65 words, describe the student\u2019s goal and the adviser\u2019s next step.',
    ],
  },
  {
    scenario: 'You are discussing a low mark with your tutor and asking for clarification of the feedback.',
    turns: [
      { speaker: 'Dr Meyer', audio: 'You wanted to discuss the result of your last assignment?', correct: 'Yes. I understand the structure comment, but I would like to know why the evidence was judged insufficient.', wrong: ['I think the mark is simply unfair.', 'I have not read the feedback.', 'I want the mark changed without discussion.'] },
      { speaker: 'Dr Meyer', audio: 'Your sources were relevant, but two of them were not peer-reviewed.', correct: 'I see. Would industry reports be acceptable if I explain their methodology?', wrong: ['So the feedback is completely wrong.', 'I will not use any sources next time.', 'Peer review is not important in this field.'] },
      { speaker: 'Dr Meyer', audio: 'That would be acceptable if you justify the source. Would you like to revise and resubmit?', correct: 'Yes, I would like to revise the evidence section and resubmit by the end of the week.', wrong: ['No, I prefer to keep the current mark.', 'I would rather write a completely new topic.', 'I do not have time to read anything.'] },
    ],
    summaries: [
      'Summarise the feedback discussion: the concern, the tutor\u2019s explanation, and the agreed revision.',
      'In 35-65 words, explain what the student learned from the feedback and what they will change.',
    ],
  },
  {
    scenario: 'You are at the student council meeting proposing a later library closing time during exams.',
    turns: [
      { speaker: 'Chair', audio: 'What change are you proposing, and why?', correct: 'I propose extending library hours to midnight during the exam period, because the current closing time leaves no quiet study space.', wrong: ['I propose cancelling all exams.', 'I think the library should close earlier.', 'I have no proposal but wanted to attend.'] },
      { speaker: 'Chair', audio: 'Have you estimated the cost of staffing those extra hours?', correct: 'The estimate is two additional staff per evening for three weeks; I have the figures in this handout.', wrong: ['I have not considered the cost.', 'Staffing is not my responsibility.', 'The library has unlimited funding.'] },
      { speaker: 'Chair', audio: 'Would a pilot during the next exam period be acceptable?', correct: 'Yes, a pilot with attendance data would let us evaluate demand before committing permanently.', wrong: ['No, it must be permanent immediately.', 'A pilot would be a waste of time.', 'I do not want to collect data.'] },
    ],
    summaries: [
      'Summarise the proposal, its cost estimate, and the agreed pilot.',
      'In 35-65 words, describe the student council proposal and decision.',
    ],
  },
  {
    scenario: 'You are asking a gym instructor to adapt a training plan after a minor injury.',
    turns: [
      { speaker: 'Coach Silva', audio: 'What happened, and how does it feel now?', correct: 'I strained my shoulder lifting last week; it is improving but still painful when I raise my arm.', wrong: ['Nothing happened, I just wanted to chat.', 'I broke my leg yesterday and ran today.', 'I feel perfect and want a harder programme.'] },
      { speaker: 'Coach Silva', audio: 'We should avoid overhead pressing for now. What training are you still able to do?', correct: 'I can cycle and do lower-body exercises without pain.', wrong: ['I cannot move at all.', 'I only want to train my shoulder.', 'I would rather stop exercising completely.'] },
      { speaker: 'Coach Silva', audio: 'I will write a plan for six weeks. When should we review it?', correct: 'Let us review it in two weeks, or sooner if the pain gets worse.', wrong: ['Never, I do not need a review.', 'In two years.', 'Only after I finish the whole programme.'] },
    ],
    summaries: [
      'Summarise the injury, the adapted training plan, and the review date.',
      'In 35-65 words, explain how the coach changed the programme after the injury.',
    ],
  },
  {
    scenario: 'You are at the library service desk asking about a book that was recalled while you still need it for an assignment.',
    turns: [
      { speaker: 'Librarian Osei', audio: 'I can see the item was recalled. How soon do you need it?', correct: 'I need it until Friday to finish my literature review; after that I can return it.', wrong: ['I returned it three weeks ago.', 'I have never borrowed a book from this library.', 'I want to complain about the opening hours.'] },
      { speaker: 'Librarian Osei', audio: 'The other reader has placed a hold. Would a short extension to Wednesday help?', correct: 'Wednesday would be tight. Could you renew it until Thursday morning instead?', wrong: ['No, I do not need the book at all.', 'I would rather buy a new copy than discuss it.', 'The other reader can wait indefinitely.'] },
      { speaker: 'Librarian Osei', audio: 'I can renew it to Thursday and send you the recall notice by email.', correct: 'Thank you. I will return it by nine on Thursday and check my email for the confirmation.', wrong: ['I will keep it until the end of the term.', 'Please cancel my library account.', 'I do not use email.'] },
    ],
    summaries: [
      'Summarise the recall problem, the extension you negotiated, and the return arrangement.',
      'In 35-65 words, explain what you needed from the library and what was agreed.',
    ],
  },
  {
    scenario: 'You are meeting your lab partner to resolve a disagreement about data that produced different results.',
    turns: [
      { speaker: 'Priya', audio: 'Your analysis shows a significant effect, but mine does not. Where should we start?', correct: 'Let us compare the raw files and check whether we cleaned the outliers the same way.', wrong: ['We should report the result that looks better.', 'One of us must have lied.', 'Let us delete the whole dataset.'] },
      { speaker: 'Priya', audio: 'I removed three measurements above the detection limit. Did you keep them?', correct: 'I kept them and flagged them, because removing them changes the mean substantially.', wrong: ['I did not open the file.', 'I deleted every value above zero.', 'I only looked at the graphs.'] },
      { speaker: 'Priya', audio: 'So we should report both analyses and explain the difference?', correct: 'Yes, and we should ask the supervisor which treatment matches the lab protocol.', wrong: ['No, we should hide the disagreement.', 'We should choose the version that is shorter.', 'The supervisor does not need to know.'] },
    ],
    summaries: [
      'Summarise the disagreement, the cause you identified, and the next step with the supervisor.',
      'In 35-65 words, describe how you resolved the difference in the data analysis.',
    ],
  },
  {
    scenario: 'You are discussing your conference poster draft with your supervisor before printing.',
    turns: [
      { speaker: 'Professor Adeyemi', audio: 'The methods section is dense. What do you want a visitor to take away?', correct: 'That we tested the coating under real weather conditions rather than only in the lab.', wrong: ['That the poster uses many colours.', 'That I have attended many conferences.', 'That the results are unimportant.'] },
      { speaker: 'Professor Adeyemi', audio: 'Then the results panel should show the durability data first. Can you cut anything?', correct: 'I can remove the literature table and summarise the gap in two sentences.', wrong: ['I can remove all the results.', 'I will add another page of text.', 'I would rather keep everything and print smaller.'] },
      { speaker: 'Professor Adeyemi', audio: 'Send me the revised file by Tuesday and we can check the figures.', correct: 'I will send it Tuesday morning and label each figure with the sample size.', wrong: ['I will print it today without changes.', 'I do not have the data anymore.', 'Figures do not need labels.'] },
    ],
    summaries: [
      'Summarise the feedback on the poster, the changes you will make, and the deadline.',
      'In 35-65 words, explain how the poster will be revised before printing.',
    ],
  },
  {
    scenario: 'You are at the student health centre describing sleep problems that began during exam preparation.',
    turns: [
      { speaker: 'Dr Rossi', audio: 'How many hours are you sleeping, and when did the pattern start?', correct: 'About four hours a night since the revision period began three weeks ago.', wrong: ['I sleep perfectly and came for a check-up.', 'I have never had trouble sleeping.', 'I only sleep during lectures.'] },
      { speaker: 'Dr Rossi', audio: 'Do you use screens in bed or drink caffeine late in the day?', correct: 'I study on my laptop until midnight and usually have coffee around seven.', wrong: ['I do not own a laptop.', 'I stopped drinking all fluids last year.', 'I go to bed at eight every evening.'] },
      { speaker: 'Dr Rossi', audio: 'Let us start with a fixed wake time and no screens after eleven. Review in two weeks?', correct: 'That sounds manageable. I will keep a sleep diary and come back in two weeks.', wrong: ['I would rather take strong medication immediately.', 'I cannot change anything.', 'I will stop attending classes.'] },
    ],
    summaries: [
      'Summarise the sleep problem, the habits discussed, and the plan you agreed to.',
      'In 35-65 words, describe the advice you received and how you will follow it.',
    ],
  },
  {
    scenario: 'You are at the international office because your student visa renewal requires a document you have not received.',
    turns: [
      { speaker: 'Advisor Klein', audio: 'Which document is missing from your application?', correct: 'The enrolment certificate has not arrived, and the visa office needs it by Friday.', wrong: ['I lost my passport photo.', 'I want to change my course.', 'My flight was cancelled.'] },
      { speaker: 'Advisor Klein', audio: 'I can issue a letter today, but the certificate comes from the registry. Have you asked them?', correct: 'Yes, they said it would be ready tomorrow but could not guarantee it.', wrong: ['No, I did not know they existed.', 'I asked them to post it abroad.', 'They refused to speak to me.'] },
      { speaker: 'Advisor Klein', audio: 'I will email the registry and give you a temporary confirmation letter.', correct: 'Thank you. Should I take the letter to the visa office myself or wait for the certificate?', wrong: ['I will travel without any documents.', 'Please keep the letter in your office.', 'I do not need a visa.'] },
    ],
    summaries: [
      'Summarise the missing document, what the registry said, and the temporary solution offered.',
      'In 35-65 words, explain the visa problem and the arrangement made at the international office.',
    ],
  },
  {
    scenario: 'You are asking a department administrator for a waiver of a prerequisite for an advanced course.',
    turns: [
      { speaker: 'Mr Haddad', audio: 'Which course do you want to take, and which prerequisite is missing?', correct: 'I want to take Applied Statistics, but I have not completed Linear Algebra.', wrong: ['I want to drop all my courses.', 'I have completed every prerequisite twice.', 'I am asking about the cafeteria menu.'] },
      { speaker: 'Mr Haddad', audio: 'The course assumes matrix notation. How would you cover that gap?', correct: 'I completed an online linear algebra module and can show my certificate and notes.', wrong: ['I would learn it during the final exam.', 'The lecturer can skip the mathematics.', 'I do not plan to attend the first weeks.'] },
      { speaker: 'Mr Haddad', audio: 'I can grant a trial waiver if you meet the lecturer in week one.', correct: 'That works. I will email the lecturer today and confirm the arrangement.', wrong: ['I would rather not speak to the lecturer.', 'A trial waiver is unnecessary.', 'I will wait until the course ends.'] },
    ],
    summaries: [
      'Summarise the course request, the missing prerequisite, and the trial arrangement.',
      'In 35-65 words, explain how you addressed the prerequisite gap and what happens next.',
    ],
  },
  {
    scenario: 'You are at a teaching assistant\u2019s office hours asking why your regression model gives unstable coefficients.',
    turns: [
      { speaker: 'Tomas', audio: 'What does your dataset look like, and how many predictors are you using?', correct: 'I have sixty observations and twelve predictors, several of which are highly correlated.', wrong: ['I have no data yet.', 'I am using one predictor and one observation.', 'I only ran a graph.'] },
      { speaker: 'Tomas', audio: 'That sounds like multicollinearity. Have you checked the correlation matrix?', correct: 'Yes, two variables correlate at 0.94, but I was not sure what to do next.', wrong: ['No, I do not know what a matrix is.', 'I deleted the outcome variable instead.', 'The correlation is exactly zero.'] },
      { speaker: 'Tomas', audio: 'Try removing one variable and compare the adjusted R-squared. Can you do that?', correct: 'I will run both models and bring the comparison to the next session.', wrong: ['I will change the research question.', 'I will report only the model I prefer.', 'I cannot use software.'] },
    ],
    summaries: [
      'Summarise the modelling problem, the cause identified, and the comparison you will run.',
      'In 35-65 words, explain the advice you received about the unstable regression.',
    ],
  },
  {
    scenario: 'You are interviewing for a part-time job at a campus café.',
    turns: [
      { speaker: 'Ms Park', audio: 'Have you worked in food service before, and what shift can you cover?', correct: 'I worked in a bakery for a year, and I can cover early mornings before classes.', wrong: ['I have no availability at all.', 'I only want to work once a month.', 'I have never spoken to a customer.'] },
      { speaker: 'Ms Park', audio: 'A customer complains that the coffee is cold. What do you do?', correct: 'I apologise, replace the drink and tell the supervisor so the machine can be checked.', wrong: ['I explain that the machine is always like that.', 'I ignore the complaint.', 'I ask the customer to leave.'] },
      { speaker: 'Ms Park', audio: 'We need someone during the exam period. Does that suit you?', correct: 'Yes, my exams finish in the first week, so I can work the remaining weeks.', wrong: ['I will be travelling for the whole period.', 'I cannot commit to any dates.', 'I would rather close the café.'] },
    ],
    summaries: [
      'Summarise the candidate\u2019s experience, how they would handle a complaint, and their availability.',
      'In 35-65 words, describe the interview and the candidate\u2019s suitability for the café job.',
    ],
  },
  {
    scenario: 'You are being interviewed for a scholarship to study abroad for one semester.',
    turns: [
      { speaker: 'Dr Lindqvist', audio: 'Why have you chosen this particular host university?', correct: 'Its coastal ecology group collects the long-term data my project depends on.', wrong: ['It is the only university I found online.', 'I want an easy semester abroad.', 'My friend lives in the city.'] },
      { speaker: 'Dr Lindqvist', audio: 'How will the exchange fit your degree requirements?', correct: 'Two modules count as electives, and my supervisor has approved the learning agreement.', wrong: ['I have not checked the requirements.', 'I plan to take no modules.', 'The exchange does not affect my degree.'] },
      { speaker: 'Dr Lindqvist', audio: 'What would you do if the research project changed after you arrived?', correct: 'I would discuss it with both supervisors and revise the plan before the deadline.', wrong: ['I would abandon the exchange.', 'I would continue without telling anyone.', 'I would demand the original project.'] },
    ],
    summaries: [
      'Summarise the reasons for the exchange, how it fits the degree, and how you would handle change.',
      'In 35-65 words, describe the scholarship interview and your plans for the semester abroad.',
    ],
  },
  {
    scenario: 'You are answering questions after presenting a seminar on your survey of student commuting.',
    turns: [
      { speaker: 'Dr Weber', audio: 'Your sample is mostly first-year students. How does that limit your conclusions?', correct: 'It may overrepresent campus residents, so I cannot generalise to commuters in later years.', wrong: ['It makes the sample perfectly representative.', 'First-year students do not commute.', 'The sample size is irrelevant.'] },
      { speaker: 'Dr Weber', audio: 'Did you weight the responses by faculty?', correct: 'Not yet. I can compare the faculty distribution with the registry and reweight the estimates.', wrong: ['Weighting is impossible in surveys.', 'I did not collect faculty data at all.', 'Weights are only for physical objects.'] },
      { speaker: 'Dr Weber', audio: 'Could the low response rate explain the pattern?', correct: 'It could, so I plan to report the response rate and test whether late replies differ.', wrong: ['No, response rates never matter.', 'I will hide the response rate.', 'The pattern is obvious without evidence.'] },
    ],
    summaries: [
      'Summarise the questions about the sample, weighting and response rate, and your answers.',
      'In 35-65 words, explain the limitations of the commuting survey and how you will address them.',
    ],
  },
  {
    scenario: 'You are rehearsing a group presentation and asking your teammate for feedback on timing.',
    turns: [
      { speaker: 'Sam', audio: 'Your section ran four minutes, but the slot is two. What can you cut?', correct: 'I can remove the background slide and keep the method and the main result.', wrong: ['I can speak faster and keep every slide.', 'I can add two more examples.', 'I can skip the result entirely.'] },
      { speaker: 'Sam', audio: 'The transition to my section is abrupt. How should we connect them?', correct: 'I will end with the research question so your methods slide answers it directly.', wrong: ['We can stop speaking between sections.', 'The audience will not notice.', 'I will start with an unrelated joke.'] },
      { speaker: 'Sam', audio: 'Shall we rehearse once more with the timer?', correct: 'Yes, and I will note where I need to slow down for the key figures.', wrong: ['No, the first run was perfect.', 'I have memorised nothing.', 'Let us rehearse without the slides or timer.'] },
    ],
    summaries: [
      'Summarise the timing problem, the cut you agreed, and the plan for the final rehearsal.',
      'In 35-65 words, describe the feedback on the presentation and the changes you will make.',
    ],
  },
  {
    scenario: 'You are at the IT help desk because a draft chapter of your thesis is missing after a laptop update.',
    turns: [
      { speaker: 'Technician Bauer', audio: 'When did you last see the file, and do you use cloud backup?', correct: 'I saved it yesterday evening, and the university cloud folder usually syncs automatically.', wrong: ['I have never used a computer.', 'The file was never important.', 'I only keep paper copies.'] },
      { speaker: 'Technician Bauer', audio: 'The local folder shows an older version. May I check the backup history?', correct: 'Yes, please. The older version is better than nothing, but I need the latest edits.', wrong: ['No, do not touch the laptop.', 'Delete all backups immediately.', 'I would rather rewrite the whole thesis.'] },
      { speaker: 'Technician Bauer', audio: 'I found a cached copy from last night. Can you open it and confirm?', correct: 'I can see the chapter and the latest paragraph. Could you show me how to enable version history?', wrong: ['That file is not mine.', 'I do not want to check it.', 'Version history is a waste of time.'] },
    ],
    summaries: [
      'Summarise the missing file, the backup search, and the recovery you confirmed.',
      'In 35-65 words, explain the IT problem and the solution found at the help desk.',
    ],
  },
  {
    scenario: 'You are meeting a tutor about a citation error flagged by plagiarism software.',
    turns: [
      { speaker: 'Dr Meyer', audio: 'A paragraph matches a source closely but has no citation. Can you explain?', correct: 'I paraphrased it from an article but forgot the reference; I can add the citation and rewrite the wording.', wrong: ['I copied it deliberately and see no problem.', 'I have never read that article.', 'The software must be broken.'] },
      { speaker: 'Dr Meyer', audio: 'The wording is also very close. What will you change?', correct: 'I will restate the argument in my own words and quote the key phrase with page numbers.', wrong: ['I will change only the font.', 'I will remove the paragraph and say nothing.', 'I will add a citation without changing the text.'] },
      { speaker: 'Dr Meyer', audio: 'Submit the corrected version through the integrity portal by Friday.', correct: 'I will upload the revised section and a short note explaining the correction.', wrong: ['I will submit it next term.', 'I do not have access to the portal.', 'I will send it to another tutor.'] },
    ],
    summaries: [
      'Summarise the citation problem, the correction you proposed, and the submission deadline.',
      'In 35-65 words, explain what the meeting covered and what you must submit.',
    ],
  },
  {
    scenario: 'You are negotiating a schedule conflict between a sports team commitment and a compulsory laboratory session.',
    turns: [
      { speaker: 'Coach Bennett', audio: 'The match is on Thursday afternoon, but your lab runs at the same time. What do you propose?', correct: 'I can attend the morning lab group and still travel with the team afterwards.', wrong: ['I will skip both commitments.', 'The lab should be cancelled for everyone.', 'I do not want to play in the match.'] },
      { speaker: 'Coach Bennett', audio: 'The morning group is full. Could you do the lab on another day?', correct: 'I can join Friday\u2019s session if the demonstrator agrees to sign my attendance.', wrong: ['No, I refuse to change anything.', 'I will copy a friend\u2019s results.', 'Lab attendance does not matter.'] },
      { speaker: 'Coach Bennett', audio: 'I will speak to the demonstrator. Confirm with me by Wednesday.', correct: 'I will email the demonstrator today and message you as soon as I have an answer.', wrong: ['I will decide after the match.', 'I do not have the demonstrator\u2019s address.', 'You should arrange everything for me.'] },
    ],
    summaries: [
      'Summarise the clash between the match and the lab, the alternative you proposed, and the deadline.',
      'In 35-65 words, describe the scheduling conflict and the plan to resolve it.',
    ],
  },
  {
    scenario: 'You are at a briefing for a coastal field trip, asking about equipment and safety.',
    turns: [
      { speaker: 'Dr Okafor', audio: 'The tide comes in quickly at the second site. What will you do if you are cut off?', correct: 'I will stay on high ground and call the coastguard rather than try to cross the channel.', wrong: ['I will swim across the channel.', 'I will wait until the water reaches me.', 'I will leave my phone in the minibus.'] },
      { speaker: 'Dr Okafor', audio: 'Do you have the required boots and waterproofs?', correct: 'I have boots, but I need to borrow waterproof trousers from the department.', wrong: ['I plan to wear trainers in the mud.', 'I do not need any equipment.', 'I will buy everything on the beach.'] },
      { speaker: 'Dr Okafor', audio: 'We leave at six. What is your role in the group?', correct: 'I am recording the sediment samples and checking the group back onto the minibus.', wrong: ['I have no role.', 'I will arrive whenever I like.', 'I am responsible for nothing.'] },
    ],
    summaries: [
      'Summarise the safety instruction, the equipment gap, and your role on the field trip.',
      'In 35-65 words, explain what you learned at the field trip briefing.',
    ],
  },
  {
    scenario: 'You are meeting a potential master\u2019s supervisor for the first time to discuss a research proposal.',
    turns: [
      { speaker: 'Professor Adeyemi', audio: 'Your proposal is broad. Which question would you actually test in one year?', correct: 'Whether green roofs reduce surface temperature more than reflective paint on the same building.', wrong: ['How to solve climate change completely.', 'Whether buildings are interesting.', 'What colour roofs look best.'] },
      { speaker: 'Professor Adeyemi', audio: 'What data could you realistically collect?', correct: 'Temperature sensors on three buildings over one summer, plus council records for roof type.', wrong: ['Satellite data for the entire planet.', 'No data, only opinions.', 'Data that has not been invented yet.'] },
      { speaker: 'Professor Adeyemi', audio: 'That is feasible. Send me a two-page outline with a timeline.', correct: 'I will send it by Monday, including milestones for the ethics application and fieldwork.', wrong: ['I will send a hundred pages tomorrow.', 'I do not need a timeline.', 'I will start fieldwork without approval.'] },
    ],
    summaries: [
      'Summarise the narrowed research question, the feasible data plan, and the outline you will send.',
      'In 35-65 words, describe the first supervision meeting and what you agreed to produce.',
    ],
  },
  {
    scenario: 'You are being interviewed by the student newspaper about a proposed tuition increase.',
    turns: [
      { speaker: 'Editor Lena', audio: 'What is your main concern about the increase?', correct: 'It will hit students who already work part-time and cannot take on more hours.', wrong: ['I think tuition should be higher.', 'I have no opinion on the proposal.', 'The newspaper should not cover money.'] },
      { speaker: 'Editor Lena', audio: 'The university says the money is needed for labs. How do you respond?', correct: 'I would ask for a breakdown of the lab budget before accepting that the increase is unavoidable.', wrong: ['Labs are irrelevant to education.', 'The university is always lying.', 'I refuse to look at any budget.'] },
      { speaker: 'Editor Lena', audio: 'Can we quote you by name in the article?', correct: 'Yes, you can use my name and my role as a second-year student.', wrong: ['No, and you cannot use anything I said.', 'Quote me as the vice-chancellor.', 'I want to remain anonymous and be named.'] },
    ],
    summaries: [
      'Summarise your concern about the fee increase, your response to the university, and the quoting agreement.',
      'In 35-65 words, describe the interview and the position you presented.',
    ],
  },
  {
    scenario: 'You are discussing a peer review you wrote for a student journal with the editor.',
    turns: [
      { speaker: 'Dr Lindqvist', audio: 'Your review says the method is unclear. Can you give the author something specific?', correct: 'I will point to the missing sample size and ask how participants were recruited.', wrong: ['I will repeat that it is unclear.', 'I will reject the paper without comments.', 'I will rewrite the paper myself.'] },
      { speaker: 'Dr Lindqvist', audio: 'The author may disagree. How will you keep the tone constructive?', correct: 'I will separate the summary of the paper from the list of requested changes.', wrong: ['I will question the author\u2019s ability.', 'I will ignore the response.', 'I will add personal criticism.'] },
      { speaker: 'Dr Lindqvist', audio: 'Can you return the revised review by Thursday?', correct: 'Yes, I will add examples and send it before noon on Thursday.', wrong: ['I need three months.', 'I have already deleted the draft.', 'I cannot give a date.'] },
    ],
    summaries: [
      'Summarise the editor\u2019s feedback, how you will improve the review, and the deadline.',
      'In 35-65 words, explain the changes you will make to the peer review.',
    ],
  },
  {
    scenario: 'You are at the language centre discussing your placement test result.',
    turns: [
      { speaker: 'Ms Ivanova', audio: 'Your reading score is strong, but your speaking score places you one level lower. How do you want to proceed?', correct: 'I would like to join the lower speaking group and keep reading in the advanced class.', wrong: ['I demand to be placed in the highest group.', 'I refuse to speak in class.', 'I want to cancel all language study.'] },
      { speaker: 'Ms Ivanova', audio: 'The timetable allows a mixed placement. What is your goal this term?', correct: 'To speak more fluently in seminars, especially when I have to disagree politely.', wrong: ['To avoid all speaking tasks.', 'To pass without attending.', 'To learn a different language instead.'] },
      { speaker: 'Ms Ivanova', audio: 'I will enrol you and arrange a monthly review.', correct: 'Thank you. I will prepare a short recording before each review so we can track progress.', wrong: ['I do not want any review.', 'I will not attend the speaking group.', 'Recording is forbidden.'] },
    ],
    summaries: [
      'Summarise the placement result, the mixed arrangement you chose, and the review plan.',
      'In 35-65 words, explain your language goals and the schedule you agreed to.',
    ],
  },
  {
    scenario: 'You are meeting a residence adviser to discuss repeated late-night noise from your roommate.',
    turns: [
      { speaker: 'Mr Dubois', audio: 'Have you spoken to your roommate directly?', correct: 'Yes, twice. They agreed to be quieter but the calls continued after midnight.', wrong: ['No, I have never met them.', 'I broke the door instead.', 'I do not live in the residence.'] },
      { speaker: 'Mr Dubois', audio: 'What outcome would you like?', correct: 'A quiet-hours agreement and, if it continues, a mediation meeting with you present.', wrong: ['Immediate eviction without a conversation.', 'Nothing at all.', 'Permission to make more noise.'] },
      { speaker: 'Mr Dubois', audio: 'I will arrange a meeting on Thursday. Will you both attend?', correct: 'Yes, I will come, and I will bring a written record of the nights it happened.', wrong: ['I will not attend.', 'I have no record and no dates.', 'Only my roommate should attend.'] },
    ],
    summaries: [
      'Summarise the noise problem, what you already tried, and the mediation plan.',
      'In 35-65 words, describe the complaint and the arrangement with the residence adviser.',
    ],
  },
  {
    scenario: 'You are at a careers fair speaking to a recruiter from an environmental consultancy.',
    turns: [
      { speaker: 'Ms Novak', audio: 'What attracts you to environmental consulting rather than research?', correct: 'I want to apply evidence to client decisions within tight deadlines, not only publish findings.', wrong: ['I dislike all environmental work.', 'I only want a job with no deadlines.', 'I have not looked at your company.'] },
      { speaker: 'Ms Novak', audio: 'Which of our projects did you read about?', correct: 'The wetland compensation scheme, especially how you monitored it after construction.', wrong: ['None of them.', 'I only read the recruitment advert.', 'A project from a different company.'] },
      { speaker: 'Ms Novak', audio: 'Our graduate applications close on Friday. Do you have a CV?', correct: 'Yes, I have a one-page CV and can tailor the cover letter tonight.', wrong: ['No, and I cannot write one.', 'I will apply next year.', 'I only have a school report.'] },
    ],
    summaries: [
      'Summarise your motivation, the project you mentioned, and the application deadline.',
      'In 35-65 words, describe the conversation at the careers fair and your next step.',
    ],
  },
  {
    scenario: 'You are requesting exam access arrangements from the disability service.',
    turns: [
      { speaker: 'Advisor Martinez', audio: 'What arrangement did you use previously, and what evidence do you have?', correct: 'I had 25 percent extra time last year, and my assessment report is attached.', wrong: ['I have never had any arrangement.', 'I want the exam cancelled.', 'I have no evidence and no diagnosis.'] },
      { speaker: 'Advisor Martinez', audio: 'The deadline for this semester is Friday. Can you submit the form today?', correct: 'Yes, I have the report and can upload the form before five.', wrong: ['I need a year to find the report.', 'I cannot use the online form.', 'I will submit after the exam.'] },
      { speaker: 'Advisor Martinez', audio: 'We will confirm with the department within three working days.', correct: 'Thank you. I will check my email and contact you if the confirmation does not arrive.', wrong: ['I will assume it is approved.', 'I will tell other students my result.', 'I do not check email.'] },
    ],
    summaries: [
      'Summarise the requested arrangement, the evidence you provided, and the confirmation process.',
      'In 35-65 words, explain the access request and what happens after submission.',
    ],
  },
  {
    scenario: 'You are asking a research ethics officer whether your interview study needs full review.',
    turns: [
      { speaker: 'Dr Weber', audio: 'Will you collect identifiable information or discuss sensitive topics?', correct: 'I will record names during recruitment but anonymise transcripts, and the topic is financial stress.', wrong: ['I will collect no data at all.', 'The topic is completely uncontroversial.', 'I plan to publish names without consent.'] },
      { speaker: 'Dr Weber', audio: 'Then full review is likely. Do you have a consent form?', correct: 'I have a draft that explains withdrawal, storage and who will see the data.', wrong: ['I was going to ask for consent afterwards.', 'Consent is unnecessary for interviews.', 'I have not written anything.'] },
      { speaker: 'Dr Weber', audio: 'Submit the form this week and allow three weeks for review.', correct: 'I will submit today and delay recruitment until approval arrives.', wrong: ['I will start interviews tomorrow.', 'I will ignore the committee.', 'I will submit after finishing the study.'] },
    ],
    summaries: [
      'Summarise the ethics concern, the consent form, and the timeline before recruitment.',
      'In 35-65 words, explain what the ethics officer required and what you will do next.',
    ],
  },
  {
    scenario: 'You are at a library workshop asking how to use a reference manager for a long essay.',
    turns: [
      { speaker: 'Librarian Chen', audio: 'Which part of referencing causes you the most trouble?', correct: 'Keeping the in-text citations and the bibliography consistent when I add sources.', wrong: ['I do not use citations.', 'I only write bibliographies by hand.', 'I have never written an essay.'] },
      { speaker: 'Librarian Chen', audio: 'Have you imported the library catalogue records or typed them manually?', correct: 'I typed them manually, which is why several author names are inconsistent.', wrong: ['I imported every record correctly.', 'I do not have any sources.', 'I deleted the catalogue.'] },
      { speaker: 'Librarian Chen', audio: 'Let us import the records and apply one citation style. Can you test it on a paragraph?', correct: 'Yes, I will add three citations and check the bibliography updates automatically.', wrong: ['I would rather retype everything.', 'Styles do not matter.', 'I will test it after submission.'] },
    ],
    summaries: [
      'Summarise the referencing problem, the cause identified, and the test you will run.',
      'In 35-65 words, describe what you learned in the reference manager workshop.',
    ],
  },
  {
    scenario: 'You are asking your seminar tutor for a reference letter for a summer research scholarship.',
    turns: [
      { speaker: 'Dr Whitfield', audio: 'You have caught me between classes. What do you need from me?', correct: 'I am applying for a research scholarship and would be grateful if you could write a reference.', wrong: ['I need directions to the train station.', 'I wanted to complain about the seminar room temperature.', 'I have already finished my degree.'] },
      { speaker: 'Dr Whitfield', audio: 'When is the deadline, and what should the letter emphasise?', correct: 'The form is due next Friday; it asks about my laboratory work and ability to work independently.', wrong: ['The deadline was last month and I forgot.', 'It should mention my favourite football team.', 'I have not looked at the form yet.'] },
      { speaker: 'Dr Whitfield', audio: 'Send me your CV and the project description by Monday.', correct: 'I will email both this afternoon and confirm the submission link.', wrong: ['I will bring them next semester.', 'I do not have a CV.', 'Please write it without any information about me.'] },
    ],
    summaries: [
      'Write a 3-sentence summary of the request: the purpose, the deadline and the material you promised to send.',
      'Summarise in 35-65 words what you asked the tutor to do and what you must provide before Monday.',
    ],
  },
  {
    scenario: 'You are at the campus bike workshop asking why your rear tyre keeps losing pressure.',
    turns: [
      { speaker: 'Mechanic Luis', audio: 'How often does it go flat?', correct: 'It loses pressure within a day, and I cannot find a visible hole in the tube.', wrong: ['The lights are too dim at night.', 'I have never ridden this bicycle.', 'The saddle is the wrong colour.'] },
      { speaker: 'Mechanic Luis', audio: 'Have you checked the rim tape and the valve?', correct: 'The valve looks fine, but the rim tape is worn and the spokes are exposed.', wrong: ['I only checked the bell.', 'The chain is clean.', 'I do not know what a tyre is.'] },
      { speaker: 'Mechanic Luis', audio: 'I will replace the tape and the tube, then test it.', correct: 'Thank you. How long should I wait before riding it?', wrong: ['I would rather buy a new bicycle.', 'Please remove the brakes.', 'I will ride it now without the wheel.'] },
    ],
    summaries: [
      'Summarise the fault, what the mechanic found and what you asked before leaving.',
      'In 35-65 words, describe the tyre problem and the repair the mechanic proposed.',
    ],
  },
  {
    scenario: 'You are asking a tutor how to form a study group for a statistics module.',
    turns: [
      { speaker: 'Tutor Osei', audio: 'Why do you want a group rather than individual revision?', correct: 'We want to work through problem sets together and explain solutions to each other.', wrong: ['We want someone else to take the exam for us.', 'The lecture hall is usually cold.', 'I enjoy group work because it is shorter.'] },
      { speaker: 'Tutor Osei', audio: 'How many students, and how will you keep the group focused?', correct: 'Four of us, with a rotating chair and a short agenda for each meeting.', wrong: ['Thirty students, with no plan.', 'Just me, but I will talk aloud.', 'We will meet only when we feel like it.'] },
      { speaker: 'Tutor Osei', audio: 'Book a room and send me your first agenda.', correct: 'We will book the small seminar room and share the agenda by Wednesday.', wrong: ['We will meet in the corridor.', 'I will send it after the exam.', 'We do not need a room.'] },
    ],
    summaries: [
      'Write a short summary of the plan: the group size, the method and the next administrative step.',
      'In 35-65 words, explain how the study group will work and what the tutor asked you to do.',
    ],
  },
  {
    scenario: 'You are at the library asking for an interlibrary loan of a thesis held by another university.',
    turns: [
      { speaker: 'Librarian Novak', audio: 'Do you have the full citation?', correct: 'Yes, I have the author, title, year and the repository record.', wrong: ['I only remember the cover colour.', 'No, I hoped you could guess it.', 'It is a novel I saw in a shop.'] },
      { speaker: 'Librarian Novak', audio: 'The loan may take two weeks and the thesis may be print-only.', correct: 'That is fine; I can plan around the delay and use a reading room copy.', wrong: ['I need it in ten minutes.', 'I refuse to use a reading room.', 'Print is not useful to me.'] },
      { speaker: 'Librarian Novak', audio: 'I will submit the request and email you the reference number.', correct: 'Thank you. Could you also tell me whether renewal is possible?', wrong: ['Please cancel my library account.', 'I will not need the number.', 'I have already read it.'] },
    ],
    summaries: [
      'Summarise the request, the expected delay and the question you asked about renewal.',
      'In 35-65 words, explain what you needed from the library and what the librarian arranged.',
    ],
  },
  {
    scenario: 'You are explaining to the laboratory coordinator why you missed a compulsory practical session.',
    turns: [
      { speaker: 'Coordinator Brennan', audio: 'Your attendance record shows an absence on Tuesday. What happened?', correct: 'I had a medical appointment and can provide a note from the clinic.', wrong: ['I forgot because the session was optional.', 'I was at the beach with friends.', 'I do not attend practicals.'] },
      { speaker: 'Coordinator Brennan', audio: 'The class was full, but there may be a catch-up group on Friday.', correct: 'I would be grateful to join it; I have already read the protocol.', wrong: ['I do not need to catch up.', 'Friday is inconvenient because of television.', 'Please cancel the module for everyone.'] },
      { speaker: 'Coordinator Brennan', audio: 'Send the note and sign the catch-up list at reception.', correct: 'I will send the note today and sign the list before noon.', wrong: ['I will do it next term.', 'I cannot sign anything.', 'The reception is closed forever.'] },
    ],
    summaries: [
      'Write a 3-sentence summary: the reason for the absence, the catch-up arrangement and your next actions.',
      'In 35-65 words, describe what you told the coordinator and what you must submit.',
    ],
  },
  {
    scenario: 'You are at the student union asking how to start a film society.',
    turns: [
      { speaker: 'Union Officer Priya', audio: 'What kind of society do you have in mind?', correct: 'A weekly screening group with short discussions and occasional guest speakers.', wrong: ['A society for people who dislike films.', 'A group that only meets online.', 'I have not thought about it.'] },
      { speaker: 'Union Officer Priya', audio: 'You will need a committee, a constitution and a risk assessment.', correct: 'I have three members ready and can draft the documents this week.', wrong: ['I will do everything alone without documents.', 'We do not need a room.', 'I want the union to run it for me.'] },
      { speaker: 'Union Officer Priya', audio: 'Submit the form and book a room for the first meeting.', correct: 'I will submit the form and book the small theatre for Thursday.', wrong: ['I will submit it next year.', 'I cannot book rooms.', 'Please give me a cinema.'] },
    ],
    summaries: [
      'Summarise the society proposal, the paperwork required and the first practical step.',
      'In 35-65 words, explain what you want to start and what the union officer told you to do.',
    ],
  },
  {
    scenario: 'You are asking cafeteria staff about options for a severe nut allergy.',
    turns: [
      { speaker: 'Catering Assistant Marco', audio: 'What can I help you with?', correct: 'I have a severe nut allergy and need to know which dishes are prepared without nuts.', wrong: ['I would like a larger table.', 'The music is too loud.', 'I am looking for a job.'] },
      { speaker: 'Catering Assistant Marco', audio: 'The soups change daily; the kitchen uses shared equipment.', correct: 'Could you check the ingredient list and tell me whether cross-contact is possible?', wrong: ['I will take the soup without asking.', 'Shared equipment is always safe.', 'I do not have an allergy.'] },
      { speaker: 'Catering Assistant Marco', audio: 'I will ask the chef and show you the sealed options.', correct: 'Thank you. I will wait here while you check.', wrong: ['I will eat it and see what happens.', 'Please remove all food from the menu.', 'I do not need the packaging.'] },
    ],
    summaries: [
      'Summarise the allergy concern, the cross-contact question and the staff response.',
      'In 35-65 words, explain what you needed to know and how the cafeteria agreed to help.',
    ],
  },
  {
    scenario: 'You are asking your professor to move your presentation because it clashes with an academic conference.',
    turns: [
      { speaker: 'Professor Adeyemi', audio: 'The schedule is tight. Why do you need a different date?', correct: 'I am presenting at a student conference that day and cannot attend both.', wrong: ['I would prefer a later start on Fridays.', 'I have not prepared anything.', 'The room is too far from the cafe.'] },
      { speaker: 'Professor Adeyemi', audio: 'I could move you to the following week, but the panel will be different.', correct: 'That is acceptable; I will prepare for the new panel and confirm the topic.', wrong: ['I want the same panel and a shorter talk.', 'I refuse to present at all.', 'Please cancel the assessment.'] },
      { speaker: 'Professor Adeyemi', audio: 'Email me the conference programme and I will confirm.', correct: 'I will send the programme this afternoon. Thank you for accommodating me.', wrong: ['I will send it after the semester.', 'I do not have a programme.', 'I already presented.'] },
    ],
    summaries: [
      'Summarise the clash, the proposed new date and the document the professor requested.',
      'In 35-65 words, explain why you need a new date and what was agreed.',
    ],
  },
  {
    scenario: 'You are at the print shop because the conference poster was printed at the wrong size.',
    turns: [
      { speaker: 'Print Assistant Hana', audio: 'Do you have the order number and the file you sent?', correct: 'Yes, the order is 4821 and the file specified A0, but the print is A2.', wrong: ['I lost the receipt and the file.', 'The poster is for a birthday party.', 'I did not order anything.'] },
      { speaker: 'Print Assistant Hana', audio: 'We can reprint today, but the larger paper costs more.', correct: 'Please reprint it at A0; I accept the difference and need it by four o\u2019clock.', wrong: ['I will take the small one and hope nobody notices.', 'Please print ten copies for free.', 'I do not need it today.'] },
      { speaker: 'Print Assistant Hana', audio: 'I will rush the order and call you when it is ready.', correct: 'Thank you. Could you check that the margins are not cut?', wrong: ['Do not call me.', 'Please fold it into a box.', 'I will collect it next month.'] },
    ],
    summaries: [
      'Summarise the printing error, the agreed reprint and the extra check you requested.',
      'In 35-65 words, describe the problem with the poster and how the shop will fix it.',
    ],
  },
  {
    scenario: 'You are asking a course administrator whether credits from a summer school can count toward your degree.',
    turns: [
      { speaker: 'Administrator Kowalski', audio: 'Which institution and modules did you complete?', correct: 'I completed two economics modules at a summer school and have the transcripts.', wrong: ['I attended a concert at another university.', 'I cannot remember the institution.', 'I have no transcripts.'] },
      { speaker: 'Administrator Kowalski', audio: 'We need the syllabus and the learning outcomes, not only the grades.', correct: 'I can send both and a copy of the reading list.', wrong: ['The grades should be enough.', 'I do not have a syllabus.', 'Please approve them without evidence.'] },
      { speaker: 'Administrator Kowalski', audio: 'The committee meets in three weeks; I will add your case.', correct: 'Thank you. I will send the documents today and check the decision date.', wrong: ['I need an answer before lunch.', 'I will not attend the meeting.', 'Please decide without me.'] },
    ],
    summaries: [
      'Summarise the credit request, the evidence required and the timeline for a decision.',
      'In 35-65 words, explain what you want recognised and what the administrator asked for.',
    ],
  },
  {
    scenario: 'You are discussing a placement offer with the placement coordinator before accepting it.',
    turns: [
      { speaker: 'Coordinator Ellis', audio: 'What concerns you about the offer?', correct: 'The start date overlaps with my final exams, and the travel allowance is unclear.', wrong: ['I dislike the company logo.', 'The office is on a nice street.', 'I have not read the offer.'] },
      { speaker: 'Coordinator Ellis', audio: 'The employer may allow a later start; should I ask?', correct: 'Yes, please ask whether I can begin after the last exam and confirm the allowance in writing.', wrong: ['No, I will simply not turn up.', 'Please reject the offer for me.', 'I want a different career.'] },
      { speaker: 'Coordinator Ellis', audio: 'I will email them today and copy you.', correct: 'Thank you. I will reply with my exam dates so they have the full picture.', wrong: ['I will not check my email.', 'Please hide my dates from them.', 'I have already accepted elsewhere.'] },
    ],
    summaries: [
      'Write a short summary of the two concerns and the action the coordinator will take.',
      'In 35-65 words, explain what you want clarified before accepting the placement.',
    ],
  },
  {
    scenario: 'You are at the sports centre because your membership card stopped working at the gate.',
    turns: [
      { speaker: 'Receptionist Tessa', audio: 'When did it last work, and do you have the card?', correct: 'It worked yesterday; the card is demagnetised and the number is still readable.', wrong: ['I lost it in another city.', 'I have never had a card.', 'The card is for a different gym.'] },
      { speaker: 'Receptionist Tessa', audio: 'I can issue a replacement for a small fee or reactivate this one.', correct: 'Please reactivate it if possible; otherwise I will pay for a replacement.', wrong: ['I want a free lifetime membership.', 'Please give me another person\u2019s card.', 'I do not need access.'] },
      { speaker: 'Receptionist Tessa', audio: 'I will test it at the gate and update your photo.', correct: 'That works for me. I will wait by the gate.', wrong: ['I will test it at home.', 'Do not change the photo.', 'I am in a hurry tomorrow.'] },
    ],
    summaries: [
      'Summarise the card problem, the options offered and the chosen solution.',
      'In 35-65 words, explain what went wrong with the card and what the receptionist will do.',
    ],
  },
  {
    scenario: 'You are at the exams office reporting that an online submission failed before the deadline.',
    turns: [
      { speaker: 'Exams Officer Rahman', audio: 'Do you have evidence that you tried to submit on time?', correct: 'Yes, I have a screenshot of the error and the confirmation email from the system.', wrong: ['I only have a verbal memory.', 'I submitted it by post.', 'I did not try to submit.'] },
      { speaker: 'Exams Officer Rahman', audio: 'The timestamp on the file may still be accepted if the system failed.', correct: 'The file was saved at 11:40, twenty minutes before the deadline, and the upload error appeared at 11:47.', wrong: ['I finished it after the deadline.', 'The file has no timestamp.', 'I deleted the file.'] },
      { speaker: 'Exams Officer Rahman', audio: 'Complete this form and the board will review it.', correct: 'I will complete it now and attach the evidence. When should I expect a decision?', wrong: ['I will complete it next month.', 'I do not want a review.', 'Please change my grade immediately.'] },
    ],
    summaries: [
      'Summarise the failed submission, the evidence you have and the review process.',
      'In 35-65 words, describe what happened at the deadline and what the exams office will do.',
    ],
  },
  {
    scenario: 'You are asking a language exchange partner to help you rehearse a presentation.',
    turns: [
      { speaker: 'Partner Sofia', audio: 'What would you like to practise?', correct: 'I need to slow down and pronounce the technical terms clearly.', wrong: ['I want to learn a completely new language today.', 'I need help with my bicycle.', 'I do not have a presentation.'] },
      { speaker: 'Partner Sofia', audio: 'Should I interrupt when I hear a mistake, or wait until the end?', correct: 'Please note the errors and discuss them after each section, so I keep the flow.', wrong: ['Interrupt every word.', 'Never tell me anything.', 'Correct only my handwriting.'] },
      { speaker: 'Partner Sofia', audio: 'Send me the slides and we can meet on Thursday.', correct: 'I will send them tonight and book a quiet room for Thursday.', wrong: ['I will send them after the presentation.', 'I cannot share slides.', 'Thursday is in another month.'] },
    ],
    summaries: [
      'Summarise what you want to improve, the feedback method and the meeting plan.',
      'In 35-65 words, explain how your partner will help you prepare for the presentation.',
    ],
  },
  {
    scenario: 'You are at the museum asking about volunteering as a gallery guide.',
    turns: [
      { speaker: 'Volunteer Coordinator Adams', audio: 'What experience do you have with visitors?', correct: 'I have led campus tours and worked at a school open day.', wrong: ['I prefer to avoid all people.', 'I have never spoken in public.', 'I only want to clean the floors.'] },
      { speaker: 'Volunteer Coordinator Adams', audio: 'Guides need training on the collection and on safeguarding.', correct: 'I can attend the six-week course and the safeguarding session.', wrong: ['I cannot attend any training.', 'Safeguarding is unnecessary.', 'I already know everything.'] },
      { speaker: 'Volunteer Coordinator Adams', audio: 'We ask for two shifts a month.', correct: 'That fits my timetable; I can start after the training.', wrong: ['I can come once a year.', 'I want to be paid as a director.', 'I will decide after the season.'] },
    ],
    summaries: [
      'Summarise the volunteering role, the training required and the time commitment.',
      'In 35-65 words, explain why you are suitable and what you agreed to attend.',
    ],
  },
  {
    scenario: 'You are asking a research ethics officer about storing survey responses securely.',
    turns: [
      { speaker: 'Ethics Officer Lund', audio: 'What kind of data will you collect?', correct: 'Anonymous responses about study habits, with no names or contact details.', wrong: ['Medical records of named patients.', 'Nothing at all.', 'Only public weather data.'] },
      { speaker: 'Ethics Officer Lund', audio: 'Even anonymous data can be re-identified if the sample is small.', correct: 'I will aggregate the results and remove free-text details that could identify someone.', wrong: ['I will publish every response verbatim.', 'Small samples are always safe.', 'I will keep the data on a public website.'] },
      { speaker: 'Ethics Officer Lund', audio: 'Store it on the university drive and delete it after the project.', correct: 'I will use the encrypted drive and set a deletion date in the plan.', wrong: ['I will keep it on my phone indefinitely.', 'I will share it with everyone.', 'I do not need a deletion date.'] },
    ],
    summaries: [
      'Summarise the data type, the re-identification risk and the storage rule.',
      'In 35-65 words, explain how you will protect the survey data and when you will delete it.',
    ],
  },
  {
    scenario: 'You are at the finance office asking about the payment deadline for a field trip.',
    turns: [
      { speaker: 'Finance Officer Iqbal', audio: 'The deposit was due last week. Did you receive the reminder?', correct: 'I did, but my funding arrived late; can I pay the deposit today?', wrong: ['I never check email.', 'I do not intend to pay.', 'The trip is not happening.'] },
      { speaker: 'Finance Officer Iqbal', audio: 'I can extend the deadline by two days, but the balance is still due before departure.', correct: 'Thank you. I will pay the deposit now and the balance on Friday.', wrong: ['I want a full refund instead.', 'Please cancel the trip for everyone.', 'I will pay after I return.'] },
      { speaker: 'Finance Officer Iqbal', audio: 'I will note the extension and send a receipt.', correct: 'I will check the receipt and keep it for my records.', wrong: ['I do not need a receipt.', 'Please send it to someone else.', 'I will ignore the balance.'] },
    ],
    summaries: [
      'Summarise the late deposit, the extension and the remaining payment date.',
      'In 35-65 words, explain the payment problem and what you agreed with the finance office.',
    ],
  },
  {
    scenario: 'You are asking the captain of a university sports club about training times and selection.',
    turns: [
      { speaker: 'Captain Deniz', audio: 'We train three evenings a week. What is your availability?', correct: 'I can attend Tuesday and Thursday but have a laboratory class on Monday.', wrong: ['I am free only at breakfast.', 'I do not play any sport.', 'I want to change the schedule for everyone.'] },
      { speaker: 'Captain Deniz', audio: 'Selection is based on attendance and a fitness test.', correct: 'I understand; when is the test and what should I bring?', wrong: ['I expect automatic selection.', 'I will skip the test.', 'I do not need to attend training.'] },
      { speaker: 'Captain Deniz', audio: 'Come to a trial session on Thursday and bring indoor shoes.', correct: 'I will be there at six with the right shoes.', wrong: ['I will come next year.', 'I do not own shoes.', 'Thursday is impossible forever.'] },
    ],
    summaries: [
      'Summarise your availability, the selection process and the trial arrangement.',
      'In 35-65 words, explain what you asked the captain and what you must bring on Thursday.',
    ],
  },
  {
    scenario: 'You are asking a lecturer whether the recorded lectures can include captions.',
    turns: [
      { speaker: 'Dr Moreau', audio: 'The recordings are automatic and often inaccurate. Why do you need captions?', correct: 'I have a hearing difficulty and rely on captions to follow technical terms.', wrong: ['I prefer watching videos at double speed.', 'I do not attend lectures.', 'The captions are for my friend who lives abroad.'] },
      { speaker: 'Dr Moreau', audio: 'I can enable the edited captions, but it takes a day.', correct: 'That would help; I can also send a list of subject-specific terms.', wrong: ['I need them immediately or not at all.', 'Please remove all captions.', 'I do not want to provide terms.'] },
      { speaker: 'Dr Moreau', audio: 'I will ask the digital team and confirm by Friday.', correct: 'Thank you. I will check on Friday and let you know if anything is missing.', wrong: ['I will not check.', 'Please cancel the module.', 'I do not need a reply.'] },
    ],
    summaries: [
      'Summarise the access need, the caption solution and the agreed follow-up.',
      'In 35-65 words, explain why captions matter to you and what the lecturer will do.',
    ],
  },
  {
    scenario: 'You are practising for a scholarship interview with a careers adviser.',
    turns: [
      { speaker: 'Adviser Campbell', audio: 'Tell me in one minute why you deserve the scholarship.', correct: 'I have strong results, a clear research question and a plan to use the award for fieldwork.', wrong: ['I deserve it because I am lucky.', 'I have no plan.', 'I want the money for a holiday.'] },
      { speaker: 'Adviser Campbell', audio: 'What will you say when asked about your weaknesses?', correct: 'I will name one real weakness and describe the steps I am taking to improve.', wrong: ['I will claim to have none.', 'I will blame my teachers.', 'I will change the subject.'] },
      { speaker: 'Adviser Campbell', audio: 'Let us run a mock interview on Monday.', correct: 'I will prepare answers and send you my research summary beforehand.', wrong: ['I cannot prepare.', 'I will skip the mock.', 'Monday is not a day.'] },
    ],
    summaries: [
      'Summarise the scholarship case, the weakness answer and the mock interview plan.',
      'In 35-65 words, describe how you will present yourself and what you will send before Monday.',
    ],
  },
  {
    scenario: 'You are meeting a residence adviser about repeated problems in a shared kitchen.',
    turns: [
      { speaker: 'Residence Adviser Gomez', audio: 'What has been happening?', correct: 'Food is left out, bins overflow and nobody follows the cleaning rota.', wrong: ['The kitchen is spotless.', 'I have my own private kitchen.', 'I never use the kitchen.'] },
      { speaker: 'Residence Adviser Gomez', audio: 'Have you spoken to your flatmates directly?', correct: 'Yes, twice, and we agreed a rota that was ignored after a week.', wrong: ['No, I prefer to complain anonymously.', 'I have not met them.', 'I want them evicted.'] },
      { speaker: 'Residence Adviser Gomez', audio: 'I can chair a flat meeting and help you write a clear agreement.', correct: 'That would help; I will suggest a meeting on Wednesday evening.', wrong: ['I do not want a meeting.', 'Please search their rooms.', 'I will move out today.'] },
    ],
    summaries: [
      'Summarise the kitchen problems, what you have already tried and the adviser offer.',
      'In 35-65 words, explain the shared-kitchen problem and the solution you agreed to try.',
    ],
  },
  {
    scenario: 'You are asking your department about funding to attend a conference.',
    turns: [
      { speaker: 'Department Officer Shaw', audio: 'Have you been accepted to present?', correct: 'Yes, my abstract was accepted for a poster session.', wrong: ['I have not applied.', 'I want to attend as a tourist.', 'I was rejected.'] },
      { speaker: 'Department Officer Shaw', audio: 'We cover travel and registration but not meals.', correct: 'I can cover meals; could you confirm the maximum for the train fare?', wrong: ['I expect everything including souvenirs.', 'I do not need to know the limit.', 'Please pay for my friend.'] },
      { speaker: 'Department Officer Shaw', audio: 'Submit the form with the acceptance letter and an estimate.', correct: 'I will send both today and keep the receipts.', wrong: ['I will submit after the trip.', 'I have no estimate.', 'I will not keep receipts.'] },
    ],
    summaries: [
      'Summarise the conference acceptance, the funding limits and the documents required.',
      'In 35-65 words, explain what funding you need and what you will submit.',
    ],
  },
  {
    scenario: 'You are asking a peer mentor how to prepare for your first seminar.',
    turns: [
      { speaker: 'Peer Mentor Aisha', audio: 'What worries you most about the seminar?', correct: 'I am unsure how much reading is expected and whether I should speak in the first session.', wrong: ['I am worried about the colour of the chairs.', 'I do not plan to attend.', 'I know everything already.'] },
      { speaker: 'Peer Mentor Aisha', audio: 'Read the core text and bring one question.', correct: 'I will take notes on the main argument and prepare a question about the evidence.', wrong: ['I will read nothing.', 'I will bring no questions.', 'I will only bring snacks.'] },
      { speaker: 'Peer Mentor Aisha', audio: 'Sit near the front and join a small group discussion.', correct: 'I will try that and ask the tutor if I am unsure.', wrong: ['I will sit at the back and stay silent.', 'I will interrupt constantly.', 'I will leave after five minutes.'] },
    ],
    summaries: [
      'Summarise your concerns, the preparation advice and the plan for the first session.',
      'In 35-65 words, explain what you will do before and during the seminar.',
    ],
  },
  {
    scenario: 'You are at the theatre box office asking about accessible seating for a performance.',
    turns: [
      { speaker: 'Box Office Clerk Iris', audio: 'What kind of access do you need?', correct: 'A wheelchair space with a companion seat and a route without steps.', wrong: ['A seat on the roof.', 'I need a microphone.', 'I do not need any access.'] },
      { speaker: 'Box Office Clerk Iris', audio: 'The lift is on the side street and the auditorium has two accessible spaces.', correct: 'Could you reserve one space and confirm the lift will be open that evening?', wrong: ['I will climb the stairs with the chair.', 'Please close the lift.', 'I do not need a reservation.'] },
      { speaker: 'Box Office Clerk Iris', audio: 'I will book the space and email you the access guide.', correct: 'Thank you. I will check the guide and call if anything is unclear.', wrong: ['I will not read it.', 'Please cancel the performance.', 'I will arrive without a ticket.'] },
    ],
    summaries: [
      'Summarise the access requirements, the booking and the information you will receive.',
      'In 35-65 words, explain what seating you need and what the box office arranged.',
    ],
  },
  {
    scenario: 'You are at the library help desk because a core e-book has disappeared from your reading list two weeks before the essay deadline.',
    turns: [
      { speaker: 'Librarian Fraser', audio: 'How can I help you today?', correct: 'The e-book for my policy module has vanished from the reading list and I can no longer open it.', wrong: ['I would like to donate some old novels.', 'The reading room is too cold in the morning.', 'I have already returned all my books.'] },
      { speaker: 'Librarian Fraser', audio: 'The licence may have expired. How many students are relying on that title?', correct: 'About forty of us were assigned chapters from it for next week.', wrong: ['The author visited our class last year.', 'I prefer paper books to screens.', 'The library closes at nine.'] },
      { speaker: 'Librarian Fraser', audio: 'I can request a short-term licence and put a print copy on reserve.', correct: 'That would solve it. Could you email the class when the print copy is ready?', wrong: ['I will buy the whole edition myself.', 'Please remove the title from the list.', 'I do not need the book after all.'] },
    ],
    summaries: [
      'Summarise the problem with the e-book, what the librarian offered, and what you asked her to do.',
      'In 35-65 words, explain why you went to the help desk and what was arranged for your class.',
    ],
  },
  {
    scenario: 'You are asking your statistics lecturer whether you may complete the assignment in a different software package from the one taught in class.',
    turns: [
      { speaker: 'Dr Nwosu', audio: 'You wanted to discuss the assignment software?', correct: 'Yes. I am more confident in R than in the package used in lectures, and I would like permission to submit in R.', wrong: ['Yes, I would like to change the assignment deadline.', 'No, I have already finished the assignment.', 'I think the lecture room is too small.'] },
      { speaker: 'Dr Nwosu', audio: 'The marking rubric rewards correct interpretation, not a particular menu.', correct: 'So as long as my code and output are included, the choice of software does not affect the mark?', wrong: ['Then I do not need to submit any output.', 'So the rubric only checks the software name.', 'Then I can skip the interpretation section.'] },
      { speaker: 'Dr Nwosu', audio: 'Exactly. Add a short appendix explaining your commands.', correct: 'I will include the script and a brief note on each step.', wrong: ['I will delete the appendix to save space.', 'I will submit only a screenshot.', 'I will use three packages at once.'] },
    ],
    summaries: [
      'Summarise the permission you requested, the lecturer\u2019s explanation of the rubric, and what you will add to the submission.',
      'In 35-65 words, describe the software discussion and the agreed format of your appendix.',
    ],
  },
  {
    scenario: 'You are at the accommodation office reporting that the heating in your room has failed during a cold spell.',
    turns: [
      { speaker: 'Housing Officer Petrov', audio: 'What is the problem in the flat?', correct: 'The radiator in my room has been cold since Monday, and the temperature is below what the contract promises.', wrong: ['The kitchen bin has not been emptied.', 'I would like to move to a larger room.', 'My neighbour plays music at night.'] },
      { speaker: 'Housing Officer Petrov', audio: 'Has anyone checked the boiler room?', correct: 'The warden looked at it yesterday and said the fault is in our flat, not the building.', wrong: ['I have not told anyone about it.', 'The boiler is in a different city.', 'I fixed it myself with tape.'] },
      { speaker: 'Housing Officer Petrov', audio: 'I will send a technician tomorrow morning. Can you be in?', correct: 'Yes, I have a seminar in the afternoon, so any time before noon suits me.', wrong: ['No, I am away for the whole term.', 'I would rather wait until summer.', 'Please come at midnight.'] },
    ],
    summaries: [
      'Summarise the heating fault, what the warden found, and the visit you agreed to.',
      'In 35-65 words, explain the problem in your room and what the accommodation office will do.',
    ],
  },
  {
    scenario: 'You are arranging the filming schedule for a group video assignment with a teammate.',
    turns: [
      { speaker: 'Teammate Jonas', audio: 'When can we film the interviews for our documentary?', correct: 'The lab is free on Thursday afternoon, so we could record the first two then.', wrong: ['I have not watched the documentary yet.', 'The camera belongs to the department.', 'Our topic is about transport.'] },
      { speaker: 'Teammate Jonas', audio: 'I have a lecture until three. Could we start at half past?', correct: 'Half past three works. I will book the room and the microphone for four hours.', wrong: ['I would prefer to cancel the project.', 'The lecture is about economics.', 'We do not need any equipment.'] },
      { speaker: 'Teammate Jonas', audio: 'And who will edit the footage?', correct: 'I can do the first cut if you check the audio and add the captions.', wrong: ['Nobody needs to edit it.', 'The tutor will film everything.', 'We can submit the raw files.'] },
    ],
    summaries: [
      'Summarise the filming plan, the equipment booking and the division of editing work.',
      'In 35-65 words, describe when you will film, what you booked and who will do which task.',
    ],
  },
  {
    scenario: 'You are at the careers service asking how to present a gap year on graduate job applications.',
    turns: [
      { speaker: 'Adviser Whitmore', audio: 'What did you do during your year away from study?', correct: 'I worked in a hotel and volunteered at a community kitchen, so I have customer and teamwork experience.', wrong: ['I have not left university yet.', 'I spent the year preparing for exams.', 'I would like a job in this building.'] },
      { speaker: 'Adviser Whitmore', audio: 'Employers will ask what you learned, not just where you were.', correct: 'I can describe handling complaints and training new volunteers, with examples of what changed.', wrong: ['I will leave the year off my CV.', 'I only remember the weather.', 'I would rather discuss my hobbies.'] },
      { speaker: 'Adviser Whitmore', audio: 'Put that in a short section called experience, not travel.', correct: 'I will rewrite it with two bullet points and a measurable result for each.', wrong: ['I will call it holiday photos.', 'I will remove all dates.', 'I will write a whole page about the hotel.'] },
    ],
    summaries: [
      'Summarise the gap-year experience, the advice about framing it, and how you will rewrite the section.',
      'In 35-65 words, explain what you did in your gap year and how the adviser told you to present it.',
    ],
  },
  {
    scenario: 'You are asking a laboratory technician to reserve a microscope for a dissertation experiment.',
    turns: [
      { speaker: 'Technician Mrs Iqbal', audio: 'Which instrument do you need?', correct: 'The inverted microscope with the camera, for three sessions next week.', wrong: ['I need a new pair of glasses.', 'The poster printer is broken.', 'I am looking for the fire exit.'] },
      { speaker: 'Technician Mrs Iqbal', audio: 'It is booked on Tuesday. Would Wednesday morning suit you?', correct: 'Wednesday from nine to twelve would be ideal, if the camera is free.', wrong: ['I only work in the evening.', 'I do not need a microscope.', 'Tuesday is my birthday.'] },
      { speaker: 'Technician Mrs Iqbal', audio: 'I will reserve it and show you the calibration procedure.', correct: 'Thank you. I will arrive ten minutes early for the induction.', wrong: ['I will skip the induction.', 'I already know everything about it.', 'Please cancel the booking.'] },
    ],
    summaries: [
      'Summarise the equipment you need, the time agreed and the induction you must attend.',
      'In 35-65 words, describe the booking and what you must do before using the microscope.',
    ],
  },
  {
    scenario: 'You are at the student conduct office explaining a misunderstanding about notes you shared in a group chat.',
    turns: [
      { speaker: 'Conduct Officer Mr Ade', audio: 'The report says your notes appeared in another student\u2019s submission. What happened?', correct: 'I posted my summary in our study group chat, but I did not know anyone would copy it into an essay.', wrong: ['I have never used a group chat.', 'I wrote the essay for another student.', 'I do not attend that module.'] },
      { speaker: 'Conduct Officer Mr Ade', audio: 'Did you label the file as your own work?', correct: 'Yes, my name and the module code were on every page.', wrong: ['No, I left it blank on purpose.', 'I deleted it immediately.', 'I cannot remember my own name.'] },
      { speaker: 'Conduct Officer Mr Ade', audio: 'We will treat this as a sharing issue, not plagiarism, if you attend a workshop.', correct: 'I understand. I will attend the session and keep future drafts private.', wrong: ['I refuse to attend anything.', 'I will share more files next time.', 'I would like the other student punished.'] },
    ],
    summaries: [
      'Summarise how your notes were shared, what the officer concluded and what you agreed to do.',
      'In 35-65 words, explain the misunderstanding and the outcome of the meeting.',
    ],
  },
  {
    scenario: 'You are asking your seminar leader whether you may record discussions to help with revision.',
    turns: [
      { speaker: 'Dr Halvorsen', audio: 'You asked about recording the seminar?', correct: 'Yes. I find it hard to take notes and follow the discussion at the same time, so I would like to record the audio.', wrong: ['Yes, I would like to lead the seminar.', 'No, I have lost my notebook.', 'I want to record a music concert.'] },
      { speaker: 'Dr Halvorsen', audio: 'Other students may not want to be recorded. How would you handle that?', correct: 'I would ask everyone\u2019s consent first and delete the file at the end of term.', wrong: ['I would publish it online.', 'I would record without telling them.', 'I would keep it forever.'] },
      { speaker: 'Dr Halvorsen', audio: 'That is acceptable. Please also share the file with anyone who misses a session.', correct: 'Of course. I will send it to the group and note that it is for revision only.', wrong: ['I will charge them for it.', 'I will sell it to another class.', 'I would rather not share anything.'] },
    ],
    summaries: [
      'Summarise why you want to record, how you will protect other students and what you will share.',
      'In 35-65 words, describe the permission you requested and the conditions attached to it.',
    ],
  },
  {
    scenario: 'You are at the student health centre asking about a vaccination required before a hospital placement.',
    turns: [
      { speaker: 'Nurse Abara', audio: 'What do you need for the placement?', correct: 'The hospital requires proof of measles vaccination, and I cannot find my childhood record.', wrong: ['I need a note for a missed lecture.', 'I would like to change my course.', 'I have a dentist appointment.'] },
      { speaker: 'Nurse Abara', audio: 'We can check your immunity with a blood test first.', correct: 'If the test shows I am not immune, how soon could I be vaccinated?', wrong: ['I would rather not know the result.', 'The test is for my eyesight.', 'I have already had the test twice.'] },
      { speaker: 'Nurse Abara', audio: 'We can vaccinate the same week and issue a letter.', correct: 'That is a relief. I will book the blood test for tomorrow morning.', wrong: ['I will wait until after the placement.', 'I do not need a letter.', 'Please cancel the placement.'] },
    ],
    summaries: [
      'Summarise the placement requirement, the test proposed and the next appointment you booked.',
      'In 35-65 words, explain what the hospital requires and what the nurse arranged.',
    ],
  },
  {
    scenario: 'You are at the exams office requesting a deferred exam after a family emergency.',
    turns: [
      { speaker: 'Exams Officer Mrs Duarte', audio: 'What are you asking for?', correct: 'I would like to defer my Friday exam because my grandmother died and I have been away from campus.', wrong: ['I would like a different examiner.', 'I want my mark changed to a pass.', 'I am looking for the exam timetable.'] },
      { speaker: 'Exams Officer Mrs Duarte', audio: 'Do you have supporting evidence?', correct: 'Yes, the hospital and the funeral director have provided letters.', wrong: ['No, I prefer not to explain.', 'I have a cinema ticket.', 'My friend can confirm it.'] },
      { speaker: 'Exams Officer Mrs Duarte', audio: 'The deferral board meets on Monday. You will sit the exam in August.', correct: 'Thank you. I will check the August date and keep the evidence on file.', wrong: ['I cannot take an exam in August.', 'I will not attend the board.', 'Please delete my record.'] },
    ],
    summaries: [
      'Summarise the reason for the deferral, the evidence supplied and the new exam date.',
      'In 35-65 words, describe your request to the exams office and what you were told.',
    ],
  },
  {
    scenario: 'You are at the international office asking how to open a local bank account as a new student.',
    turns: [
      { speaker: 'Adviser Ms Kowal', audio: 'Have you tried the bank on the high street?', correct: 'Not yet. I was told I need a letter confirming my address and enrolment.', wrong: ['Yes, I have closed my account.', 'I do not need a bank account.', 'The bank is next to my house.'] },
      { speaker: 'Adviser Ms Kowal', audio: 'We can issue that letter today. Do you have your passport and visa?', correct: 'I have both, and I can bring the tenancy agreement as well.', wrong: ['I left my passport abroad.', 'My visa expired last year.', 'I only have a library card.'] },
      { speaker: 'Adviser Ms Kowal', audio: 'Then book an appointment with the bank and take all four documents.', correct: 'I will book online this afternoon and keep copies of everything.', wrong: ['I will post the originals.', 'I will go without documents.', 'I will ask the bank to come here.'] },
    ],
    summaries: [
      'Summarise the documents you need, the letter the office will issue and your next step.',
      'In 35-65 words, explain what you must take to the bank and what you will do first.',
    ],
  },
  {
    scenario: 'You are asking your professor for feedback on a conference abstract that was rejected.',
    turns: [
      { speaker: 'Professor Lindgren', audio: 'You received the decision?', correct: 'Yes, it was rejected, and the reviews say the method section was too vague.', wrong: ['Yes, I have not opened the email.', 'No, I never submitted anything.', 'I am going to the conference as a speaker.'] },
      { speaker: 'Professor Lindgren', audio: 'Did they explain what was missing?', correct: 'One reviewer asked for the sample size and another for the statistical test.', wrong: ['They praised the title only.', 'They asked me to change hotels.', 'They want a different conference.'] },
      { speaker: 'Professor Lindgren', audio: 'We can revise and submit to the spring meeting.', correct: 'I will rewrite the method, add the numbers and send you a draft by Friday.', wrong: ['I will submit the same version.', 'I will abandon the project.', 'I will remove the results.'] },
    ],
    summaries: [
      'Summarise the rejection, the reviewers\u2019 objections and the revision plan.',
      'In 35-65 words, explain what the reviews said and what you will change before resubmitting.',
    ],
  },
  {
    scenario: 'You are at the campus transport office asking about a discounted annual bus pass.',
    turns: [
      { speaker: 'Transport Assistant Mr Bell', audio: 'Are you a full-time student?', correct: 'Yes, I am in my second year and I commute from the other side of the city.', wrong: ['No, I graduated five years ago.', 'I do not use public transport.', 'I live next to the campus.'] },
      { speaker: 'Transport Assistant Mr Bell', audio: 'The annual pass is cheaper, but it is paid in one instalment.', correct: 'Could I pay monthly instead, even if it costs a little more?', wrong: ['I would like a free ticket.', 'I will pay in ten years.', 'I do not need a pass at all.'] },
      { speaker: 'Transport Assistant Mr Bell', audio: 'Yes, there is a monthly plan for students. Bring your ID card.', correct: 'I will bring my card and set up the payment tomorrow.', wrong: ['I will bring my passport photo only.', 'I will send my brother instead.', 'I will wait until the pass expires.'] },
    ],
    summaries: [
      'Summarise your commuting situation, the payment problem and the plan you chose.',
      'In 35-65 words, describe the pass you asked about and what you need to bring.',
    ],
  },
  {
    scenario: 'You are discussing the working hours of a part-time research assistant role with a postdoctoral researcher.',
    turns: [
      { speaker: 'Dr Mensah', audio: 'The project needs about ten hours a week. Does that fit your timetable?', correct: 'Ten hours is fine, but I have lectures on Tuesday and Thursday mornings.', wrong: ['I can only work sixty hours a week.', 'I do not have a timetable.', 'I would like to work at night only.'] },
      { speaker: 'Dr Mensah', audio: 'We could schedule you on Monday and Wednesday afternoons.', correct: 'That suits me. Would the hours be flexible during exam weeks?', wrong: ['I would prefer every day at dawn.', 'I do not want any schedule.', 'Monday is a public holiday forever.'] },
      { speaker: 'Dr Mensah', audio: 'Yes, as long as the total is agreed in advance.', correct: 'Then I will confirm my hours each month and log them in the shared sheet.', wrong: ['I will never log my time.', 'I will work without telling you.', 'I will change the total without asking.'] },
    ],
    summaries: [
      'Summarise the hours offered, the scheduling problem and how you will record your time.',
      'In 35-65 words, explain what hours you can work and what was agreed about exams.',
    ],
  },
  {
    scenario: 'You are asking a music teacher how to practise a difficult passage without hurting your wrist.',
    turns: [
      { speaker: 'Teacher Mr Rossi', audio: 'Where does the pain appear?', correct: 'On the outside of my right wrist, mostly when I play repeated chords.', wrong: ['In my left ankle when I walk.', 'Behind my eyes when I read.', 'In my shoulder when I sleep.'] },
      { speaker: 'Teacher Mr Rossi', audio: 'Do you tense up before the difficult bar?', correct: 'Yes, I notice my fingers curl and my forearm tightens just before it.', wrong: ['No, I never practise that bar.', 'I only play with my elbow.', 'I have not touched the piano.'] },
      { speaker: 'Teacher Mr Rossi', audio: 'Slow the passage down and release the tension between each chord.', correct: 'I will practise it at half speed and stop whenever I feel the grip tighten.', wrong: ['I will play it faster to finish sooner.', 'I will ignore the pain and continue.', 'I will stop playing for a year.'] },
    ],
    summaries: [
      'Summarise the pain, its cause in your playing and the practice method you will try.',
      'In 35-65 words, describe the problem with your wrist and the teacher\u2019s advice.',
    ],
  },
  {
    scenario: 'You are at the sustainability office proposing a reusable cup scheme for the library café.',
    turns: [
      { speaker: 'Sustainability Officer Ms Feld', audio: 'What is the idea?', correct: 'A deposit scheme where students borrow a cup and return it to any campus café.', wrong: ['A plan to close the library café.', 'A new brand of paper napkin.', 'A campaign against cycling.'] },
      { speaker: 'Sustainability Officer Ms Feld', audio: 'How would you keep the cups from disappearing?', correct: 'A small deposit, return points in three buildings and a weekly count.', wrong: ['By giving cups away free.', 'By hiding the cups.', 'By asking staff to buy them.'] },
      { speaker: 'Sustainability Officer Ms Feld', audio: 'We could pilot it for one term in two cafés.', correct: 'I will draft the pilot plan and measure returns and washing costs.', wrong: ['I will launch it across the country.', 'I will not measure anything.', 'I will cancel the cafés.'] },
    ],
    summaries: [
      'Summarise the scheme you proposed, how cups would be tracked and the pilot plan.',
      'In 35-65 words, explain your idea to reduce cup waste and what the officer suggested.',
    ],
  },
  {
    scenario: 'You are asking your dissertation supervisor to help narrow an overbroad research question.',
    turns: [
      { speaker: 'Dr Ferreira', audio: 'What is your current question?', correct: 'I want to know how social media affects young people, which is far too wide.', wrong: ['I have not chosen a topic yet.', 'I would like to change supervisor.', 'My question is about the library.'] },
      { speaker: 'Dr Ferreira', audio: 'Pick one platform, one age group and one outcome.', correct: 'Then I could study how short videos affect sleep in first-year students.', wrong: ['Then I could study everything at once.', 'Then I could ignore the evidence.', 'Then I could change country.'] },
      { speaker: 'Dr Ferreira', audio: 'That is answerable within your word limit. What data will you use?', correct: 'A survey of about eighty students plus a small set of interviews.', wrong: ['I will use no data at all.', 'I will interview the whole city.', 'I will rely on my own opinion.'] },
    ],
    summaries: [
      'Summarise the original question, the narrower version agreed and the data you plan to collect.',
      'In 35-65 words, explain how your supervisor helped you focus the dissertation.',
    ],
  },
  {
    scenario: 'You are at the sports centre booking a badminton court for a departmental tournament.',
    turns: [
      { speaker: 'Receptionist Mr Osei', audio: 'How many courts do you need?', correct: 'Three courts for four hours on a Saturday, if they are available.', wrong: ['One court for ten minutes.', 'A swimming pool for the term.', 'I do not need a court.'] },
      { speaker: 'Receptionist Mr Osei', audio: 'Saturday mornings are busy. Would the afternoon work?', correct: 'The afternoon is fine, as long as we can finish before six.', wrong: ['I can only play at midnight.', 'Saturday is impossible every week.', 'I would rather cancel the tournament.'] },
      { speaker: 'Receptionist Mr Osei', audio: 'I will hold the courts and send you a booking form.', correct: 'I will complete the form and pay the deposit today.', wrong: ['I will pay after the event.', 'I will not complete any form.', 'I will book a different sport.'] },
    ],
    summaries: [
      'Summarise the courts you need, the time change and the paperwork you must complete.',
      'In 35-65 words, describe your tournament booking and what the receptionist arranged.',
    ],
  },
  {
    scenario: 'You are asking a language tutor for advice before your oral exam.',
    turns: [
      { speaker: 'Tutor Ms Almeida', audio: 'Which part of the oral exam worries you most?', correct: 'The discussion, because I freeze when I cannot find the right word.', wrong: ['The written essay.', 'The listening test.', 'The exam building.'] },
      { speaker: 'Tutor Ms Almeida', audio: 'What do you do when a word is missing?', correct: 'I usually stop. I could describe the idea instead of searching for the exact term.', wrong: ['I speak in my first language.', 'I leave the room.', 'I ask the examiner for the answer.'] },
      { speaker: 'Tutor Ms Almeida', audio: 'Practise paraphrasing with a partner for ten minutes a day.', correct: 'I will record myself describing three topics and review the pauses.', wrong: ['I will memorise every word.', 'I will avoid speaking practice.', 'I will only read grammar books.'] },
    ],
    summaries: [
      'Summarise the part of the exam that worries you, the strategy discussed and your practice plan.',
      'In 35-65 words, explain the difficulty you described and how you will prepare for it.',
    ],
  },
  {
    scenario: 'You are at the museum studies department asking to borrow a handling collection for a school workshop.',
    turns: [
      { speaker: 'Curator Dr Beaumont', audio: 'What would you like to borrow?', correct: 'A box of domestic objects from the 1950s that students can touch safely.', wrong: ['The entire Egyptian gallery.', 'A painting from the main hall.', 'The museum entrance desk.'] },
      { speaker: 'Curator Dr Beaumont', audio: 'Some items are fragile. How will you supervise them?', correct: 'Two adults will sit with each table and count the objects before and after.', wrong: ['Students can take them home.', 'I will leave them unattended.', 'I will not count anything.'] },
      { speaker: 'Curator Dr Beaumont', audio: 'We can lend the box for one week with a condition report.', correct: 'I will sign the report and return everything in the same condition.', wrong: ['I will keep it for a year.', 'I will skip the report.', 'I will replace broken items with new ones.'] },
    ],
    summaries: [
      'Summarise the objects requested, the supervision plan and the conditions of the loan.',
      'In 35-65 words, describe what you want to borrow and how you will keep it safe.',
    ],
  },
  {
    scenario: 'You are reporting a lost USB stick containing unpublished research data to the IT security team.',
    turns: [
      { speaker: 'Security Analyst Mr Haas', audio: 'When did you last see the drive?', correct: 'Yesterday afternoon in the psychology lab, after I copied the interview files.', wrong: ['I have never owned a USB stick.', 'It is in my bag right now.', 'I found it this morning.'] },
      { speaker: 'Security Analyst Mr Haas', audio: 'Was the data encrypted?', correct: 'No, and it included participant names, so I am worried about disclosure.', wrong: ['Yes, and it was empty.', 'It contained only music.', 'It was encrypted with a password I lost.'] },
      { speaker: 'Security Analyst Mr Haas', audio: 'We will log the loss and ask you to notify the ethics committee.', correct: 'I will email the committee today and describe exactly which files are missing.', wrong: ['I will wait until next year.', 'I will not tell anyone.', 'I will delete the project.'] },
    ],
    summaries: [
      'Summarise what was lost, why it is sensitive and the notifications you must make.',
      'In 35-65 words, explain the data loss and the steps the security team required.',
    ],
  },
  {
    scenario: 'You are asking your course representative to raise a concern about overcrowded tutorials.',
    turns: [
      { speaker: 'Course Rep Amara', audio: 'What should I take to the staff meeting?', correct: 'That our tutorial group has thirty students for a room with twenty chairs.', wrong: ['My opinion of the cafeteria.', 'A request for longer holidays.', 'The timetable for another course.'] },
      { speaker: 'Course Rep Amara', audio: 'Have you raised it with the tutor directly?', correct: 'Yes, she agrees but says the room allocation is out of her hands.', wrong: ['No, I have told nobody.', 'The tutor refused to speak to us.', 'I do not attend tutorials.'] },
      { speaker: 'Course Rep Amara', audio: 'I will ask for a larger room or a second group.', correct: 'Thank you. Could you also ask whether the group can be split before the next assessment?', wrong: ['Please keep the group as it is.', 'I would like fewer tutorials.', 'Ask them to cancel the module.'] },
    ],
    summaries: [
      'Summarise the overcrowding problem, what the tutor said and what you asked the representative to do.',
      'In 35-65 words, describe the concern you raised and the request made at the staff meeting.',
    ],
  },
  {
    scenario: 'You are at the print room asking for a bound copy of your dissertation.',
    turns: [
      { speaker: 'Print Assistant Mr Varga', audio: 'What format do you need?', correct: 'A soft-bound copy with the title on the cover and the pages printed single-sided.', wrong: ['A poster for a conference.', 'A set of business cards.', 'A birthday banner.'] },
      { speaker: 'Print Assistant Mr Varga', audio: 'We need the file as a PDF with margins of at least two centimetres.', correct: 'I will check the margins and send the final PDF this afternoon.', wrong: ['I will send a photograph.', 'I do not have a file.', 'I will write it by hand.'] },
      { speaker: 'Print Assistant Mr Varga', audio: 'Binding takes two working days. Is Thursday early enough?', correct: 'Thursday is fine, as the submission desk closes on Friday at noon.', wrong: ['I need it last week.', 'I will collect it in a month.', 'Please post it abroad.'] },
    ],
    summaries: [
      'Summarise the printing requirements, the file you must send and the collection date.',
      'In 35-65 words, explain what you ordered and why the timing matters.',
    ],
  },
  {
    scenario: 'You are asking a university counsellor for help with anxiety before presentations.',
    turns: [
      { speaker: 'Counsellor Ms Adeyemi', audio: 'What happens before you present?', correct: 'My hands shake, my mouth dries up and I cannot sleep the night before.', wrong: ['I feel very calm and confident.', 'I enjoy standing on stage.', 'I have never given a presentation.'] },
      { speaker: 'Counsellor Ms Adeyemi', audio: 'Have you tried practising in the room where you will speak?', correct: 'Not yet. I usually rehearse alone in my bedroom.', wrong: ['Yes, I rehearse on a bus.', 'I do not need to practise.', 'The room is always locked.'] },
      { speaker: 'Counsellor Ms Adeyemi', audio: 'We can also work on breathing and a short opening you know well.', correct: 'I will write the first two sentences and practise them with a friend.', wrong: ['I will avoid all presentations.', 'I will read the whole script silently.', 'I will speak for an hour.'] },
    ],
    summaries: [
      'Summarise the symptoms you described, the practice you have done and the plan you agreed.',
      'In 35-65 words, explain your presentation anxiety and what the counsellor suggested.',
    ],
  },
  {
    scenario: 'You are asking the campus shop manager to stock cheaper stationery for students.',
    turns: [
      { speaker: 'Shop Manager Mr Doyle', audio: 'What are students asking for?', correct: 'Basic notebooks and pens that cost less than the branded sets on the shelf.', wrong: ['More imported chocolate.', 'A larger car park.', 'Longer opening hours on Sunday.'] },
      { speaker: 'Shop Manager Mr Doyle', audio: 'The cheap lines have thin margins. Would a student discount help?', correct: 'Yes, a discount on own-brand items would make them affordable.', wrong: ['No, prices should rise.', 'I would like free products.', 'Discounts are illegal.'] },
      { speaker: 'Shop Manager Mr Doyle', audio: 'I will trial an own-brand range for one term.', correct: 'I will ask students which three items they need most and report back.', wrong: ['I will choose nothing.', 'I will order luxury pens only.', 'I will close the shop.'] },
    ],
    summaries: [
      'Summarise the products requested, the discount idea and the trial the manager agreed to.',
      'In 35-65 words, explain what you asked the shop to stock and how the trial will be reviewed.',
    ],
  },
  {
    scenario: 'You are at a postgraduate open day asking a PhD student about their path into research.',
    turns: [
      { speaker: 'PhD Student Ravi', audio: 'What did you study before starting your PhD?', correct: 'I did a physics degree, then worked in a lab for two years before applying.', wrong: ['I have never studied science.', 'I started a PhD at sixteen.', 'I only studied art.'] },
      { speaker: 'PhD Student Ravi', audio: 'Was the gap between degrees useful?', correct: 'Very. It showed me which questions I actually wanted to spend years on.', wrong: ['No, it was a waste of time.', 'I cannot remember it.', 'It made me leave research.'] },
      { speaker: 'PhD Student Ravi', audio: 'Talk to potential supervisors early and read their recent papers.', correct: 'I will email two supervisors with a short proposal and ask for a meeting.', wrong: ['I will apply without reading anything.', 'I will email every professor at once.', 'I will wait until the deadline.'] },
    ],
    summaries: [
      'Summarise the speaker\u2019s route into research, what the gap gave them and the advice you received.',
      'In 35-65 words, describe what you learned about preparing for a PhD application.',
    ],
  },
  {
    scenario: 'You are at the exams office disputing a mark that appears to have been added up incorrectly.',
    turns: [
      { speaker: 'Exams Officer Mr Takahashi', audio: 'Which module is affected?', correct: 'Introduction to Statistics. My coursework and exam marks do not add up to the grade shown.', wrong: ['A module I never took.', 'The whole degree programme.', 'A module from another university.'] },
      { speaker: 'Exams Officer Mr Takahashi', audio: 'We can request a clerical check. Do you have the breakdown?', correct: 'Yes, the portal shows sixty percent coursework and forty percent exam.', wrong: ['No, I have no evidence.', 'I would like a new examiner.', 'The breakdown is secret.'] },
      { speaker: 'Exams Officer Mr Takahashi', audio: 'The check takes ten working days and may confirm the mark.', correct: 'I understand. Please tell me if the mark changes or stays the same.', wrong: ['I expect it changed today.', 'I will not accept any answer.', 'Please cancel the module.'] },
    ],
    summaries: [
      'Summarise the mark you are disputing, the evidence you have and what happens next.',
      'In 35-65 words, explain why you think the mark is wrong and what the office will do.',
    ],
  },
  {
    scenario: 'You are asking a lecturer for the reading list before term starts.',
    turns: [
      { speaker: 'Dr S\u00f8rensen', audio: 'Why do you need the list so early?', correct: 'The two key books are expensive, so I want to borrow them before the library runs out.', wrong: ['I want to avoid all reading.', 'I am not enrolled yet.', 'I prefer not to buy books.'] },
      { speaker: 'Dr S\u00f8rensen', audio: 'The list is not final, but the core text is settled.', correct: 'Could you tell me the core text and which chapters are most important?', wrong: ['Please send every book ever written.', 'I will wait until the exam.', 'I do not need the core text.'] },
      { speaker: 'Dr S\u00f8rensen', audio: 'I will send the first four weeks by Friday.', correct: 'Thank you. I will reserve the core text and start the opening chapter.', wrong: ['I will ignore the email.', 'I will buy the whole library.', 'I will change modules.'] },
    ],
    summaries: [
      'Summarise why you asked for the list early, the information the lecturer offered and your plan.',
      'In 35-65 words, explain your request and what you will do when the list arrives.',
    ],
  },
  {
    scenario: 'You are at the volunteering office signing up to tutor pupils at a local school.',
    turns: [
      { speaker: 'Volunteering Officer Ms Grant', audio: 'What subject would you like to teach?', correct: 'Maths, preferably with pupils preparing for their final school exams.', wrong: ['I would like to coach football.', 'I do not want to teach anything.', 'I am only interested in cooking.'] },
      { speaker: 'Volunteering Officer Ms Grant', audio: 'We need a police check and two references.', correct: 'I can provide both, and I already have a recent background certificate.', wrong: ['I cannot give any names.', 'I have no identification.', 'I would rather not be checked.'] },
      { speaker: 'Volunteering Officer Ms Grant', audio: 'Training is on Wednesday evening. Can you attend?', correct: 'Yes, I can be there at six and stay for the whole session.', wrong: ['I am busy every Wednesday forever.', 'I will skip the training.', 'I will arrive at midnight.'] },
    ],
    summaries: [
      'Summarise the subject you want to tutor, the checks required and the training you will attend.',
      'In 35-65 words, describe your volunteering application and what happens next.',
    ],
  },
  {
    scenario: 'You are asking a laboratory technician why the centrifuge stopped in the middle of a run.',
    turns: [
      { speaker: 'Technician Dr Malik', audio: 'What did the display show?', correct: 'An imbalance warning, and the lid stayed locked for a minute.', wrong: ['The time and date.', 'A weather forecast.', 'Nothing at all.'] },
      { speaker: 'Technician Dr Malik', audio: 'Were the tubes filled to the same level?', correct: 'Not exactly. One tube had noticeably less liquid than the others.', wrong: ['They were all empty.', 'I did not load any tubes.', 'They were filled with sand.'] },
      { speaker: 'Technician Dr Malik', audio: 'That triggered the safety brake. Balance them by weight next time.', correct: 'I will weigh each tube and pair them before starting the rotor.', wrong: ['I will ignore the warning.', 'I will use one tube only.', 'I will run it with the lid open.'] },
    ],
    summaries: [
      'Summarise what the machine reported, the cause of the stop and how you will prevent it.',
      'In 35-65 words, explain the centrifuge problem and the technician\u2019s instruction.',
    ],
  },
  {
    scenario: 'You are discussing with your personal tutor whether to take a placement year in industry.',
    turns: [
      { speaker: 'Dr Ibarra', audio: 'What is holding you back?', correct: 'I worry that a year away will make me forget the theory and lose touch with my friends.', wrong: ['I have already accepted a placement.', 'I do not know what a placement is.', 'I want to leave university now.'] },
      { speaker: 'Dr Ibarra', audio: 'Placements often sharpen final-year work. Have you found a host?', correct: 'I have an interview with a water company next month.', wrong: ['No, I have not looked.', 'I would like to work abroad forever.', 'I want to be paid to sleep.'] },
      { speaker: 'Dr Ibarra', audio: 'Keep the four-year route open until the interview result.', correct: 'I will confirm the interview and decide after I hear back.', wrong: ['I will withdraw today.', 'I will never decide.', 'I will change my degree subject.'] },
    ],
    summaries: [
      'Summarise your doubts about a placement year, the interview you have and the advice given.',
      'In 35-65 words, explain the decision you are facing and what you will do next.',
    ],
  },
  {
    scenario: 'You are at the library desk asking to book a quiet study room during the exam period.',
    turns: [
      { speaker: 'Library Assistant Ms Rossi', audio: 'How long do you need the room?', correct: 'Two hours each morning for the next week, if possible.', wrong: ['The whole building for a party.', 'Ten minutes tomorrow.', 'I do not need a room.'] },
      { speaker: 'Library Assistant Ms Rossi', audio: 'Those slots are popular. Are you working alone?', correct: 'Yes, alone, so a small single room is enough.', wrong: ['No, with a brass band.', 'I have not decided.', 'I want the largest room.'] },
      { speaker: 'Library Assistant Ms Rossi', audio: 'I can offer nine to eleven. Bring your card to collect the key.', correct: 'I will be there at nine and return the key straight after.', wrong: ['I will come at noon.', 'I will keep the key.', 'I will send someone else.'] },
    ],
    summaries: [
      'Summarise the room you need, the slot offered and what you must bring.',
      'In 35-65 words, describe your study-room booking and the arrangements for the key.',
    ],
  },
  {
    scenario: 'You are asking a careers adviser how to negotiate a deadline for accepting a job offer.',
    turns: [
      { speaker: 'Adviser Ms Byrne', audio: 'When does the employer want an answer?', correct: 'They asked for a decision by Friday, but I am still waiting for a second interview.', wrong: ['I have already accepted.', 'They never contacted me.', 'I do not want the job.'] },
      { speaker: 'Adviser Ms Byrne', audio: 'You can ask for an extension without sounding ungrateful.', correct: 'I could thank them, explain the other process and ask for one more week.', wrong: ['I could ignore the email.', 'I could demand a higher salary first.', 'I could accept both jobs.'] },
      { speaker: 'Adviser Ms Byrne', audio: 'That is reasonable. Keep the request short and specific.', correct: 'I will send a polite email today asking whether Monday week is possible.', wrong: ['I will send nothing.', 'I will ask for a year.', 'I will withdraw my application.'] },
    ],
    summaries: [
      'Summarise the deadline problem, the wording the adviser suggested and the email you will send.',
      'In 35-65 words, explain your situation and how you plan to ask for more time.',
    ],
  },
  {
    scenario: 'You are in a tutorial explaining why you think the essay marking criteria were applied unfairly.',
    turns: [
      { speaker: 'Tutor Dr Kaur', audio: 'Which criterion do you think was misapplied?', correct: 'The structure mark. My paragraphs follow the plan, but the feedback says there is no argument.', wrong: ['The handwriting mark.', 'The attendance mark.', 'The room booking.'] },
      { speaker: 'Tutor Dr Kaur', audio: 'Can you show me where the argument is stated?', correct: 'In the second paragraph, though I now see it is buried under background detail.', wrong: ['I cannot find my essay.', 'I did not write an essay.', 'The argument is in another module.'] },
      { speaker: 'Tutor Dr Kaur', audio: 'That is a fair point. I will reread it with you.', correct: 'Thank you. I would like to understand how to make the claim visible earlier.', wrong: ['I want the mark changed without review.', 'I will appeal to the vice-chancellor.', 'I will stop attending.'] },
    ],
    summaries: [
      'Summarise the criterion you questioned, what you noticed in your essay and the tutor\u2019s response.',
      'In 35-65 words, explain your disagreement and what you hope to learn from the review.',
    ],
  },
  {
    scenario: 'You are at the student union society fair asking about joining the debate society.',
    turns: [
      { speaker: 'Society Secretary Mr Lang', audio: 'Have you debated before?', correct: 'Only in school, and I am nervous about speaking without notes.', wrong: ['I have never spoken aloud.', 'I am a professional judge.', 'I do not like arguing.'] },
      { speaker: 'Society Secretary Mr Lang', audio: 'We run beginner sessions on Tuesdays. Would that suit you?', correct: 'Tuesday works. Do I need to prepare anything for the first session?', wrong: ['I can only come on Sunday.', 'I do not want to learn.', 'I will bring my own podium.'] },
      { speaker: 'Society Secretary Mr Lang', audio: 'Just bring an open mind. We pair beginners with a mentor.', correct: 'That sounds ideal. I will come along next week and try one round.', wrong: ['I will skip the beginner sessions.', 'I will demand a trophy.', 'I will argue with the mentor.'] },
    ],
    summaries: [
      'Summarise your debating experience, the beginner session and the plan for your first visit.',
      'In 35-65 words, explain why you want to join and what the secretary told you.',
    ],
  },
  {
    scenario: 'You are asking a visiting lecturer about a study they mentioned during a guest lecture.',
    turns: [
      { speaker: 'Dr Moreau', audio: 'Which study do you mean?', correct: 'The one about noise and reading speed, with the primary school sample.', wrong: ['The one about the history of chess.', 'The lecture about marine biology.', 'The study I presented last year.'] },
      { speaker: 'Dr Moreau', audio: 'It was published in a journal I can send you.', correct: 'Could you send the citation? I would like to read the method section closely.', wrong: ['I do not read journals.', 'Please summarise the whole field.', 'I only need the title.'] },
      { speaker: 'Dr Moreau', audio: 'I will email it, but the sample was small.', correct: 'I will keep that limitation in mind when I cite it.', wrong: ['I will treat it as definitive.', 'I will ignore the sample.', 'I will quote the abstract only.'] },
    ],
    summaries: [
      'Summarise the study you asked about, what the lecturer will send and the limitation you noted.',
      'In 35-65 words, describe your question after the lecture and the lecturer\u2019s reply.',
    ],
  },
  {
    scenario: 'You are at the fire safety briefing for your residential hall.',
    turns: [
      { speaker: 'Fire Officer Mr Okafor', audio: 'Where is your nearest fire exit?', correct: 'At the end of the corridor, past the shared kitchen on the left.', wrong: ['Through the window on the third floor.', 'I have not looked.', 'In the basement car park.'] },
      { speaker: 'Fire Officer Mr Okafor', audio: 'What would you do if the alarm sounded at night?', correct: 'Wake my flatmates, leave by the stairs and meet at the assembly point.', wrong: ['Wait for the lift.', 'Finish my essay first.', 'Go back to sleep.'] },
      { speaker: 'Fire Officer Mr Okafor', audio: 'Where is the assembly point for this building?', correct: 'On the grass behind the sports hall, away from the building.', wrong: ['In the lobby next to the lifts.', 'In my room on the second floor.', 'At the bus stop across the road.'] },
    ],
    summaries: [
      'Summarise the exit route, the action to take at night and the assembly point.',
      'In 35-65 words, describe what you learned at the fire safety briefing.',
    ],
  },
  {
    scenario: 'You are asking a research nurse what taking part in a psychology experiment would involve.',
    turns: [
      { speaker: 'Research Nurse Ms Haddad', audio: 'Have you read the information sheet?', correct: 'Yes, but I am unsure how long the memory task will take.', wrong: ['No, I cannot read.', 'I have already finished it.', 'I do not want to take part.'] },
      { speaker: 'Research Nurse Ms Haddad', audio: 'About forty minutes, with breaks. You may withdraw at any time.', correct: 'If I withdraw halfway, will my data still be used?', wrong: ['I will demand payment.', 'I will bring a friend to answer.', 'I will not sign anything.'] },
      { speaker: 'Research Nurse Ms Haddad', audio: 'No, you can ask us to delete it before analysis.', correct: 'Then I am happy to take part and I will sign the consent form.', wrong: ['I will sign for someone else.', 'I will withdraw after the results.', 'I do not need the sheet.'] },
    ],
    summaries: [
      'Summarise what the experiment involves, your question about withdrawal and your decision.',
      'In 35-65 words, explain what you learned about taking part and what you agreed to.',
    ],
  },
  {
    scenario: 'You are at the department office asking about a replacement student ID card.',
    turns: [
      { speaker: 'Administrator Mrs Novak', audio: 'What happened to your card?', correct: 'I lost it on the bus, and I need a new one before the library exam booking opens.', wrong: ['I never collected one.', 'I want a new photograph.', 'My card works perfectly.'] },
      { speaker: 'Administrator Mrs Novak', audio: 'There is a small fee and you need photo identification.', correct: 'I have my passport and can pay by card today.', wrong: ['I have no identification.', 'I cannot pay anything.', 'I would rather use my gym card.'] },
      { speaker: 'Administrator Mrs Novak', audio: 'The new card will be ready tomorrow afternoon.', correct: 'I will collect it after my lecture and check that the library access works.', wrong: ['I will collect it next term.', 'I will not test it.', 'I will keep using the old one.'] },
    ],
    summaries: [
      'Summarise why you need a new card, what you must provide and when it will be ready.',
      'In 35-65 words, describe your visit to the department office and the replacement process.',
    ],
  },
  {
    scenario: 'You are asking your tutor to approve a change of topic for your term paper.',
    turns: [
      { speaker: 'Tutor Dr Bianchi', audio: 'Why do you want to change?', correct: 'My original topic on housing policy has too few sources, but I have found good material on rent controls.', wrong: ['I have not started the course.', 'I dislike writing essays.', 'I want a longer deadline.'] },
      { speaker: 'Tutor Dr Bianchi', audio: 'Rent controls is narrower. Can you still use your reading?', correct: 'Yes, three of my sources discuss both, so the work is not wasted.', wrong: ['No, I will start from nothing.', 'I have not read anything.', 'I would rather keep both topics.'] },
      { speaker: 'Tutor Dr Bianchi', audio: 'Send me a one-page outline by Monday and I will approve it.', correct: 'I will send the outline with a short source list on Sunday evening.', wrong: ['I will send a hundred pages.', 'I will not send anything.', 'I will change topic again tomorrow.'] },
    ],
    summaries: [
      'Summarise why you want to change topic, how your reading still helps and the outline you will send.',
      'In 35-65 words, explain the new topic and what your tutor asked you to submit.',
    ],
  },
  {
    scenario: 'You are at the lost property office looking for a lab coat left in a lecture theatre.',
    turns: [
      { speaker: 'Lost Property Assistant Mr Costa', audio: 'When and where did you lose it?', correct: 'On Tuesday after the chemistry lecture in the Faraday building.', wrong: ['I never had a lab coat.', 'In another country last year.', 'At a football match.'] },
      { speaker: 'Lost Property Assistant Mr Costa', audio: 'Does it have a name inside?', correct: 'Yes, my surname is written on the collar in black marker.', wrong: ['No, it is brand new.', 'It has someone else\u2019s name.', 'I cannot remember my name.'] },
      { speaker: 'Lost Property Assistant Mr Costa', audio: 'We have one matching that description. Can you describe the size?', correct: 'It is a medium, with a small burn mark on the left sleeve.', wrong: ['It is enormous and green.', 'I do not know what it looks like.', 'It has no sleeves.'] },
    ],
    summaries: [
      'Summarise where and when the coat was lost, how it is marked and how you identified it.',
      'In 35-65 words, describe your visit to lost property and the item you claimed.',
    ],
  },
  {
    scenario: 'You are asking your supervisor about authorship order on a paper you helped write.',
    turns: [
      { speaker: 'Professor Nakamura', audio: 'What is your concern?', correct: 'I wrote the analysis and two sections, but the draft lists me after a student who joined late.', wrong: ['I do not want to be an author.', 'I have not contributed anything.', 'I want the paper withdrawn.'] },
      { speaker: 'Professor Nakamura', audio: 'Authorship should reflect contribution. Can you document yours?', correct: 'Yes, I have the scripts, drafts and notes from our meetings.', wrong: ['No, my work was invisible.', 'I only made coffee.', 'I would rather not say.'] },
      { speaker: 'Professor Nakamura', audio: 'Send me that record and we will discuss it with the whole team.', correct: 'I will share a short contribution statement before our next meeting.', wrong: ['I will publish the paper alone.', 'I will remove everyone else.', 'I will refuse to meet.'] },
    ],
    summaries: [
      'Summarise your contribution, why the order seems wrong and the evidence you will provide.',
      'In 35-65 words, explain your authorship concern and what your supervisor proposed.',
    ],
  },
  {
    scenario: 'You are at the wellbeing service asking about group sessions for exam stress.',
    turns: [
      { speaker: 'Wellbeing Adviser Ms Lindberg', audio: 'Have you attended anything like this before?', correct: 'No, but I have been waking at four and cannot concentrate on revision.', wrong: ['Yes, I run the sessions.', 'I never feel stressed.', 'I do not take exams.'] },
      { speaker: 'Wellbeing Adviser Ms Lindberg', audio: 'The group meets on Thursdays and is led by a counsellor.', correct: 'That sounds manageable. Is it a drop-in group or do I need to commit to all six weeks?', wrong: ['I would like individual therapy instead.', 'I cannot attend any weekday.', 'I want a medical certificate.'] },
      { speaker: 'Wellbeing Adviser Ms Lindberg', audio: 'It is a closed group, so attendance matters.', correct: 'Then I will commit to the six sessions and tell you now if I cannot come.', wrong: ['I will come only once.', 'I will send a friend.', 'I will decide at the end.'] },
    ],
    summaries: [
      'Summarise your symptoms, the group format and the commitment you accepted.',
      'In 35-65 words, explain why you contacted the service and what was arranged.',
    ],
  },
  {
    scenario: 'You are asking a lecturer to clarify what critical analysis means in the essay rubric.',
    turns: [
      { speaker: 'Dr Whitfield', audio: 'Which part of the rubric is unclear?', correct: 'The phrase critical analysis. I am not sure whether it means criticising the author or weighing evidence.', wrong: ['The word essay.', 'The submission date.', 'The font size.'] },
      { speaker: 'Dr Whitfield', audio: 'It means examining how an argument is built, not simply disagreeing.', correct: 'So I should identify the author\u2019s assumptions and test them against other studies?', wrong: ['So I should insult the author.', 'So I should summarise only.', 'So I should ignore the question.'] },
      { speaker: 'Dr Whitfield', audio: 'Exactly. Show one strength and one limitation in each section.', correct: 'I will revise my draft to add a limitation and a counter-example.', wrong: ['I will remove all analysis.', 'I will write only quotations.', 'I will shorten the essay to a page.'] },
    ],
    summaries: [
      'Summarise what confused you, the lecturer\u2019s definition and how you will revise the draft.',
      'In 35-65 words, explain what critical analysis means and what you will change.',
    ],
  },
  {
    scenario: 'You are at the alumni office asking about mentoring current students as a recent graduate.',
    turns: [
      { speaker: 'Alumni Officer Mr Duarte', audio: 'How much time could you offer?', correct: 'About two hours a month, mostly online in the evening.', wrong: ['I have no time at all.', 'I can work full-time for free.', 'I do not want to help students.'] },
      { speaker: 'Alumni Officer Mr Duarte', audio: 'We match mentors with final-year students in your field.', correct: 'That suits me. I studied civil engineering and now work on water projects.', wrong: ['I studied something unrelated.', 'I have no professional experience.', 'I would rather mentor children.'] },
      { speaker: 'Alumni Officer Mr Duarte', audio: 'There is a short training session and a confidentiality agreement.', correct: 'I will complete both before the first meeting.', wrong: ['I will skip the agreement.', 'I will share student details publicly.', 'I will start without training.'] },
    ],
    summaries: [
      'Summarise the time you can offer, your professional background and what you must complete first.',
      'In 35-65 words, describe your mentoring offer and the requirements for volunteers.',
    ],
  },
  {
    scenario: 'You are on the phone reporting a broken lock at a campus bike-share station.',
    turns: [
      { speaker: 'Helpline Operator Ms Sanchez', audio: 'What is the bike number?', correct: 'It is 4127, at the rack outside the engineering building.', wrong: ['I do not have a bike.', 'The station is in another city.', 'I cannot read numbers.'] },
      { speaker: 'Helpline Operator Ms Sanchez', audio: 'Does the lock release at all?', correct: 'No, the app says the ride ended, but the lock is still closed.', wrong: ['Yes, it opens perfectly.', 'I have not tried it.', 'The bike is not there.'] },
      { speaker: 'Helpline Operator Ms Sanchez', audio: 'We will send a mechanic and end the charge.', correct: 'Thank you. Will the app confirm when the bike is available again?', wrong: ['I will leave with the bike.', 'I do not want a refund.', 'I will break the lock myself.'] },
    ],
    summaries: [
      'Summarise the fault, the bike\u2019s location and what the operator will do.',
      'In 35-65 words, explain the problem with the bike-share lock and the outcome of your call.',
    ],
  },
  {
    scenario: 'You are asking a lab demonstrator to repeat the explanation of a titration.',
    turns: [
      { speaker: 'Demonstrator Ms Owusu', audio: 'Which step was unclear?', correct: 'When to stop adding the solution from the burette.', wrong: ['How to switch on the lights.', 'Where to hang my coat.', 'Why we are in the lab.'] },
      { speaker: 'Demonstrator Ms Owusu', audio: 'You stop at the first permanent colour change.', correct: 'So I add drop by drop once the colour starts to fade, and swirl after each one?', wrong: ['So I pour the whole bottle at once.', 'So I stop before adding anything.', 'So I wait until it turns black.'] },
      { speaker: 'Demonstrator Ms Owusu', audio: 'Exactly, and record the volume to two decimal places.', correct: 'I will read the bottom of the meniscus and write the value immediately.', wrong: ['I will estimate roughly.', 'I will read the top of the tube.', 'I will record nothing.'] },
    ],
    summaries: [
      'Summarise the step you did not understand, the method explained and how you will record the result.',
      'In 35-65 words, describe your question in the lab and what the demonstrator told you.',
    ],
  },
  {
    scenario: 'You are at the international student society planning a cultural evening.',
    turns: [
      { speaker: 'Society Chair Mr Haddad', audio: 'What should our cultural evening include?', correct: 'A short programme of music and food from four countries, with students introducing each part.', wrong: ['A single long film with no introduction.', 'Only speeches by the committee.', 'A sports tournament.'] },
      { speaker: 'Society Chair Mr Haddad', audio: 'We have a small budget. How should we spend it?', correct: 'On ingredients and room hire, with costumes borrowed rather than bought.', wrong: ['On expensive gifts for guests.', 'On a fireworks display.', 'On nothing at all.'] },
      { speaker: 'Society Chair Mr Haddad', audio: 'Can you coordinate the food stalls?', correct: 'Yes, I will contact four student groups and confirm their dishes by Friday.', wrong: ['I will cook everything alone.', 'I will not contact anyone.', 'I will cancel the stalls.'] },
    ],
    summaries: [
      'Summarise the programme, the budget plan and your responsibility for the food stalls.',
      'In 35-65 words, describe the cultural evening you planned and what you agreed to organise.',
    ],
  },
];

export const readThenSpeakTopics = [
  { statement: 'Cities should ban private cars from their historic centres.', focuses: ['the effect on local businesses', 'people with reduced mobility', 'how success should be measured'] },
  { statement: 'Universities should make all lectures available online for free.', focuses: ['the cost to institutions', 'students who need structure', 'the effect on academic standards'] },
  { statement: 'Employers should be required to publish salary ranges in job adverts.', focuses: ['fairness between candidates', 'small companies', 'how it changes negotiation'] },
  { statement: 'Social media companies should be legally responsible for harmful content.', focuses: ['free expression', 'the practicality of moderation', 'the effect on smaller platforms'] },
  { statement: 'Governments should pay every citizen a basic income regardless of work.', focuses: ['the labour market', 'the cost and taxation', 'who would benefit most'] },
  { statement: 'Schools should teach financial literacy before foreign languages.', focuses: ['the skills young people need', 'the value of languages', 'how the curriculum should be decided'] },
  { statement: 'Cities should replace parking spaces with trees and cycle lanes.', focuses: ['traffic and deliveries', 'public health', 'the effect on local shops'] },
  { statement: 'Companies should be allowed to monitor employees\u2019 messages at work.', focuses: ['privacy', 'security and safety', 'trust inside a team'] },
  { statement: 'Volunteering should be a requirement for university graduation.', focuses: ['the value to the community', 'students who already work', 'whether compulsory service is meaningful'] },
  { statement: 'Museums should return artefacts to the countries they came from.', focuses: ['the purpose of museums', 'care and preservation', 'the claims of modern nations'] },
  { statement: 'Remote work makes cities less innovative.', focuses: ['how ideas spread', 'the cost of commuting', 'who is excluded'] },
  { statement: 'Advertising aimed at children should be banned completely.', focuses: ['children\u2019s judgement', 'the effect on media funding', 'what counts as advertising'] },
  { statement: 'Public transport should be free at the point of use.', focuses: ['how it would be funded', 'congestion and the environment', 'the quality of the service'] },
  { statement: 'Universities should consider applicants\u2019 backgrounds, not only their grades.', focuses: ['fairness', 'academic standards', 'how background is measured'] },
  { statement: 'Artificial intelligence should be allowed to write legal and medical advice.', focuses: ['risk and responsibility', 'access to expertise', 'the role of professionals'] },
  { statement: 'Tourism should be limited in overcrowded historic cities.', focuses: ['the local economy', 'residents\u2019 quality of life', 'how limits would be enforced'] },
  { statement: 'All new buildings should be required to produce their own energy.', focuses: ['construction costs', 'the environment', 'older buildings and poorer owners'] },
  { statement: 'Sporting events should not be held in countries with poor human-rights records.', focuses: ['the effect on athletes', 'whether engagement changes regimes', 'who decides the standard'] },
  { statement: 'Children should not have smartphones before the age of fourteen.', focuses: ['safety and communication', 'social pressure', 'what parents can realistically control'] },
  { statement: 'The four-day working week should become the standard.', focuses: ['productivity', 'customer-facing industries', 'what workers would do with the time'] },
  { statement: 'Governments should require all new homes to have solar panels.', focuses: ['construction costs', 'the electricity grid', 'renters and landlords'] },
  { statement: 'School uniforms should be abolished.', focuses: ['cost for families', 'discipline and belonging', 'how dress codes are enforced'] },
  { statement: 'Companies should publish the carbon footprint of every product.', focuses: ['what counts in the measurement', 'small businesses', 'consumer behaviour'] },
  { statement: 'Public libraries should lend tools and equipment, not only books.', focuses: ['the cost of maintenance', 'who would use the service', 'liability and safety'] },
  { statement: 'Cities should make public toilets free and widely available.', focuses: ['public health', 'the cost of upkeep', 'safety and design'] },
  { statement: 'Universities should stop using ranked league tables in their marketing.', focuses: ['what the rankings measure', 'applicants\u2019 decisions', 'the pressure on institutions'] },
];

export const interactiveSpeakingScenarios = [
  { scenario: 'You are in a seminar on public health discussing how to reduce sugar consumption.', tasks: ['Suggest one practical policy and explain who it targets.', 'Explain why voluntary labelling has not worked well enough.', 'Compare a tax on sugary drinks with a ban on advertising.', 'Summarise the strongest objection to your proposal and answer it.'] },
  { scenario: 'You are talking to your academic advisor about a failed assignment.', tasks: ['Explain what went wrong without blaming the tutor.', 'Propose a concrete plan for the resubmission.', 'Ask for the support you need and explain why.', 'Summarise what you have learned from the experience.'] },
  { scenario: 'You are in a job interview for a role that requires teamwork.', tasks: ['Describe a team conflict you helped resolve.', 'Explain what you would do if a colleague missed a deadline.', 'Persuade the interviewer that you can lead without authority.', 'Ask one question about how the team works.'] },
  { scenario: 'You are at a city council meeting about a new housing development.', tasks: ['Support the proposal with one argument about housing supply.', 'Raise one concern about infrastructure and propose a condition.', 'Respond to a resident who says the development will ruin the neighbourhood.', 'Summarise the decision you would recommend.'] },
  { scenario: 'You are presenting a group project on renewable energy to a panel.', tasks: ['Explain the main finding in one minute.', 'Justify the method you chose.', 'Answer a question about the limitations of your data.', 'Recommend one policy based on your results.'] },
  { scenario: 'You are discussing whether your university should adopt a four-day week.', tasks: ['Explain how it would affect students.', 'Address the concerns of staff in customer-facing roles.', 'Propose how the change could be piloted and measured.', 'Summarise your position in one sentence.'] },
  { scenario: 'You are in a tutorial about a controversial historical interpretation.', tasks: ['Summarise the author\u2019s argument fairly.', 'Explain one weakness in the evidence.', 'Offer an alternative interpretation.', 'Respond to a classmate who disagrees with you.'] },
  { scenario: 'You are speaking to a customer whose order arrived damaged.', tasks: ['Acknowledge the problem and apologise appropriately.', 'Explain the options available to the customer.', 'Respond to the customer\u2019s request for compensation.', 'Confirm the next steps and the timeline.'] },
  { scenario: 'You are in a meeting about whether to automate part of a warehouse.', tasks: ['Explain the efficiency argument.', 'Describe the effect on current employees.', 'Propose a transition plan.', 'Answer a question about safety risks.'] },
  { scenario: 'You are at an international student orientation, introducing your country.', tasks: ['Describe one custom that visitors might find surprising.', 'Explain how your education system differs from the local one.', 'Recommend one place a new student should visit.', 'Answer a question about language learning.'] },
  { scenario: 'You are a volunteer explaining a recycling scheme to residents.', tasks: ['Explain what can and cannot be recycled.', 'Address the objection that the scheme is inconvenient.', 'Describe what happens to the collected material.', 'Encourage one specific behaviour change.'] },
  { scenario: 'You are discussing online privacy with a friend who says it does not matter.', tasks: ['Explain one concrete risk of sharing personal data.', 'Respond to the argument that ordinary people have nothing to hide.', 'Suggest one practical habit that improves privacy.', 'Summarise the disagreement fairly.'] },
  { scenario: 'You are presenting a proposal for a student mental-health service.', tasks: ['Describe the problem with one piece of evidence.', 'Explain the service you propose.', 'Address a question about cost.', 'Recommend how success would be measured.'] },
  { scenario: 'You are in a debate about whether museums should be free.', tasks: ['Support free entry with an argument about access.', 'Explain the funding problem.', 'Propose a compromise.', 'Respond to the claim that free museums are overcrowded.'] },
  { scenario: 'You are explaining a scientific idea to a general audience.', tasks: ['Define the idea without jargon.', 'Give one everyday example.', 'Correct a common misunderstanding.', 'Summarise why the idea matters.'] },
  { scenario: 'You are showing a new student how to search library databases for a first essay.', tasks: ['Explain how to choose keywords for a search.', 'Show how to narrow results without losing useful sources.', 'Explain why a catalogue and a database are different.', 'Suggest what to do when a result is behind a paywall.'] },
  { scenario: 'You are in a meeting about reducing food waste in the student cafeteria.', tasks: ['Describe the size of the problem using one example.', 'Propose one change to how food is served.', 'Address the concern that the change will raise prices.', 'Recommend how the cafeteria should measure success.'] },
  { scenario: 'You are presenting your research poster to a visitor who is not a specialist.', tasks: ['Explain the question your study addresses in plain language.', 'Describe the method without using technical terms.', 'Answer a question about what the results do not show.', 'Suggest one practical use of the findings.'] },
  { scenario: 'You are at a public consultation explaining a proposed cycle route to residents.', tasks: ['Summarise the benefits for the neighbourhood.', 'Respond to a shop owner who fears losing parking.', 'Explain how safety at junctions would be improved.', 'Describe how the council would review the scheme.'] },
  { scenario: 'You are training a new volunteer at a community garden.', tasks: ['Explain the weekly routine and who is responsible for what.', 'Demonstrate how to water and weed without damaging plants.', 'Describe what to do if a visitor is injured.', 'Answer a question about when to harvest.'] },
];
