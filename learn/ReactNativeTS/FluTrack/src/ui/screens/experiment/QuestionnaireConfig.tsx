const comp = "HOUSEHOLD COMPOSITION";
const expo = "HOUSEHOLD EXPOSURE";
const hist = "ILLNESS HISTORY";
const demo = "DEMOGRAPHIC INFORMATION";

export const questionnaire = [
  {
    section: comp,
    data: {
      title: "Where do you live?",
      buttons: [
        { label: "Done", primary: true },
        { label: "Prefer Not to Say", primary: false },
      ],
    },
  },
  {
    section: comp,
    data: {
      title: "How many people live in your household?",
      buttons: [
        { label: "Done", primary: true },
        { label: "Prefer Not to Say", primary: false },
      ],
    },
  },
  {
    section: comp,
    data: {
      title: "What is your bed assignment?",
      buttons: [
        { label: "Done", primary: true },
        { label: "Do Not Know", primary: false },
        { label: "Prefer Not to Say", primary: false },
      ],
    },
  },
  {
    section: comp,
    data: {
      title: "What describes your living situation?",
      buttons: [
        { label: "Done", primary: true },
        { label: "Prefer Not to Say", primary: false },
      ],
    },
  },
  {
    section: comp,
    data: {
      title: "What is your current address?",
      buttons: [{ label: "Done", primary: true }],
    },
  },
  {
    section: expo,
    data: {
      description:
        "Next, we are going to ask you some questions about people you may have been in contact with. For the purposes of this study, we define contact as physical touching between you and another person, or being within 6 feet of another person for at least two minutes. As a reference, 6 feet is approximately 2 rows of a city bus.",
      buttons: [{ label: "I understand", primary: true }],
    },
  },
  {
    section: expo,
    data: {
      title:
        "In the past week, have you been in contact with a person with cough, sore throat, or fever?",
      buttons: [
        { label: "Yes", primary: true },
        { label: "No", primary: true },
        { label: "Do Not Know", primary: false },
      ],
    },
  },
  {
    section: expo,
    data: {
      title:
        "In the past week, have you been in contact with any children under 5 years of age for over an hour?",
      buttons: [{ label: "Done", primary: true }],
    },
  },
  {
    section: expo,
    data: {
      title:
        "Do any children in your household attend a school, childcare setting, or play group with at least 3 other children for 3 or more hours / week?",
      buttons: [
        { label: "Yes", primary: true },
        { label: "No", primary: true },
        { label: "Do Not Know", primary: false },
      ],
    },
  },
  {
    section: expo,
    data: {
      title: "Do you smoke tobacco, marijuana, or vape?",
      buttons: [
        { label: "Yes", primary: true },
        { label: "No", primary: true },
        { label: "Prefer Not to Say", primary: false },
      ],
    },
  },
  {
    section: expo,
    data: {
      title: "Does anyone in your household smoke tobacco, marijuana, or vape?",
      buttons: [
        { label: "Yes", primary: true },
        { label: "No", primary: true },
        { label: "Prefer Not to Say", primary: false },
      ],
    },
  },
  {
    section: expo,
    data: {
      title: "Where have you arrived from?",
      buttons: [{ label: "Done", primary: true }],
    },
  },
  {
    section: expo,
    data: {
      title: "Where have you travelled in the last week?",
      buttons: [
        { label: "Done", primary: true },
        { label: "Do Not Know", primary: false },
      ],
    },
  },
  {
    section: expo,
    data: {
      title:
        "Over the last 4 weeks, where have you spent the majority of your waking hours?",
      buttons: [{ label: "Done", primary: true }],
    },
  },
  {
    section: expo,
    data: {
      title: "What is your occupation?",
      buttons: [{ label: "Done", primary: true }],
    },
  },
  {
    section: expo,
    data: {
      title:
        "Please provide the address or location name of your primary place of employment.",
      buttons: [{ label: "Done", primary: true }],
    },
  },
  {
    section: expo,
    data: {
      title: "How many hours worked per day?",
      buttons: [{ label: "Done", primary: true }],
    },
  },
  {
    section: expo,
    data: {
      title: "Please provide the address or location name of your school.",
      buttons: [{ label: "Done", primary: true }],
    },
  },
  {
    section: expo,
    data: {
      title:
        "Thinking of a typical day, how many people do you come into contact with?",
      buttons: [
        { label: "Done", primary: true },
        { label: "Do Not Know", primary: false },
      ],
    },
  },
  {
    section: hist,
    data: {
      title: "Did you receive a flu shot in the past 6 months?",
      buttons: [
        { label: "Yes", primary: true },
        { label: "No", primary: true },
        { label: "Do Not Know", primary: false },
      ],
    },
  },
  {
    section: hist,
    data: {
      title: "What was the date of vaccination?",
      buttons: [
        { label: "Done", primary: true },
        { label: "Do Not Know", primary: false },
      ],
    },
  },
  {
    section: hist,
    data: {
      title: "When did your current symptoms start?",
      buttons: [{ label: "Done", primary: true }],
    },
  },
  {
    section: hist,
    data: {
      title:
        "Have you taken any antibiotics or antivirals for your current illness?",
      buttons: [
        { label: "Yes", primary: true },
        { label: "No", primary: true },
        { label: "Do Not Know", primary: false },
      ],
    },
  },
  /*
  {
    section: hist,
    data: { 
      title: 'Is your illness interfering with daily activities?',
      buttons: [
        { label: 'Yes', primary: true },
        { label: 'No', primary: true },
      ],
    },
  },
  {
    section: hist,
    data: { 
      title: 'Have you been to a health care setting (clinic, emergency room, or hospital) for the symptoms you have had this week?',
      buttons: [
        { label: 'Yes', primary: true },
        { label: 'No', primary: true },
        { label: 'Do Not Know', primary: false },
      ],
    },
  },
  {
    section: hist,
    data: { 
      title: 'In the last 12 months, how many times have you visited a doctor for a cough or a cold?',
      buttons: [
        { label: 'Done', primary: true },
      ],
    },
  },
  {
    section: demo,
    data: { 
      title: 'What was your assigned sex at birth?',
      buttons: [
        { label: 'Male', primary: true },
        { label: 'Female', primary: true },
        { label: 'Prefer Not to Say', primary: false },
      ],
    },
  },
  {
    section: demo,
    data: { 
      title: 'Are you currently pregnant?',
      buttons: [
        { label: 'Yes', primary: true },
        { label: 'No', primary: true },
        { label: 'Prefer Not to Say', primary: false },
      ],
    },
  },
  {
    section: demo,
    data: { 
      title: 'Which one or more of the following would you use to describe your race?',
      buttons: [
        { label: 'Done', primary: true },
        { label: 'Prefer Not to Say', primary: false },
      ],
    },
  },
  {
    section: demo,
    data: { 
      title: 'Do you consider yourself to be of Hispanic or Latino descent?',
      buttons: [
        { label: 'Yes', primary: true },
        { label: 'No', primary: true },
        { label: 'Prefer Not to Say', primary: false },
      ],
    },
  },
  {
    section: demo,
    data: { 
      title: 'What is your health insurance status?',
      buttons: [
        { label: 'Done', primary: true },
        { label: 'Do Not Know', primary: false },
        { label: 'Prefer Not to Say', primary: false },
      ],
    },
  },
  */
];
