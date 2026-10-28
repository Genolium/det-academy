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
