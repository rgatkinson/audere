const comp = "HOUSEHOLD COMPOSITION";
const expo = "HOUSEHOLD EXPOSURE";
const hist = "ILLNESS HISTORY";
const demo = "DEMOGRAPHIC INFORMATION";

export const sectionDescriptions = new Map<string, string>([
  [hist, "Next, we are going to ask you some questions about your health."],
  [demo, "Next, we are going to ask you some questions about yourself."],
]);

export const questionnaire = [
  {
    section: comp,
    data: {
      id: "WhereLive",
      conditionalNext: {
        options: new Map([
          ["house", "Bedrooms"],
          ["apartment", "Bedrooms"],
          ["shelter", "BedAssignment"],
        ]),
      },
      nextQuestion: "Address",
      title: "Where do you live?",
      optionList: {
        options: [
          "house",
          "shelter",
          "apartment",
          "dormitory",
          "assistedLiving",
          "skilledNursingCenter",
          "noneOfTheAbove",
        ],
        multiSelect: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: comp,
    data: {
      id: "Bedrooms",
      nextQuestion: "Address",
      title: "How many bedrooms do you have?",
      optionList: {
        options: [
          "1bedroom",
          "2bedrooms",
          "3bedrooms",
          "4bedrooms",
          "moreThan4Bedrooms",
        ],
        multiSelect: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: comp,
    data: {
      id: "BedAssignment",
      nextQuestion: "Address",
      title: "What is your bed assignment?",
      textInput: {
        placeholder: "Bed assignment",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: comp,
    data: {
      id: "Address",
      nextQuestion: "ExpoDesc",
      title: "What is your current address?",
      addressInput: {
        showLocationField: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withAddress" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "ExpoDesc",
      nextQuestion: "NearSickPeople",
      description:
        "Next, we are going to ask you some questions about people you may have been in contact with. For the purposes of this study, we define contact as physical touching between you and another person, or being within 6 feet of another person for at least two minutes. As a reference, 6 feet is approximately 2 rows of a city bus.",
      buttons: [{ key: "understand", primary: true, enabled: true }],
    },
  },
  {
    section: expo,
    data: {
      id: "NearSickPeople",
      conditionalNext: {
        buttonKeys: new Map([["yes", "CoughSneeze"]]),
      },
      nextQuestion: "NearChildren",
      title:
        "In the past week, have you been around a person who seemed to have a cold?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "CoughSneeze",
      nextQuestion: "NearChildren",
      title: "Were they coughing or sneezing?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "NearChildren",
      nextQuestion: "ChildrenNearChildren",
      title:
        "In the past week, have you been in contact with any children under 5 years of age for over an hour?",
      optionList: {
        options: ["1child", "2to5children", "moreThan5children", "none"],
        multiSelect: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "ChildrenNearChildren",
      nextQuestion: "Smoke",
      title:
        "Do any children in your household attend a school, childcare setting, or play group with at least 3 other children for 3 or more hours / week?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "Smoke",
      nextQuestion: "HouseholdSmoke",
      title: "Do you smoke tobacco, marijuana, or vape?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "HouseholdSmoke",
      adminConditionalNext: [
        // TODO: read location from admin settings
        // if cruise ship or whatever, "ArrivedFrom"
      ],
      nextQuestion: "RecentTravel",
      title: "Does anyone in your house smoke?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "ArrivedFrom",
      // TODO: figure out how to determine if they arrived from outside of wa,
      // add conditional next if within to RecentTravel default to TimeSpent
      nextQuestion: "RecentTravel",
      title: "Where have you arrived from?",
      textInput: {
        placeholder: "City",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "RecentTravel",
      nextQuestion: "TimeSpent",
      title: "Where have you travelled in the last week?",
      optionList: {
        options: [
          "withinWashingtonStateOnly",
          "toAnotherUSState",
          "toAnotherCountry",
        ],
        multiSelect: true,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "TimeSpent",
      conditionalNext: {
        options: new Map([["work", "Occupation"], ["school", "SchoolName"]]),
      },
      nextQuestion: "NumPeople",
      title:
        "Over the last 4 weeks and when you are awake, where have you spent the majority of your time?",
      optionList: {
        options: ["work", "school", "home", "other"],
        multiSelect: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "Occupation",
      nextQuestion: "WorkAddress",
      title: "What is your occupation?",
      textInput: {
        placeholder: "Occupation",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "WorkAddress",
      nextQuestion: "HoursWorked",
      title: "Where do you work?",
      addressInput: {
        showLocationField: true,
      },
      buttons: [
        { key: "done", primary: true, enableD: "withAddress" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "HoursWorked",
      nextQuestion: "NumPeople",
      title: "How many hours worked per day?",
      numberInput: {
        placeholder: "Number of hours",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withNumber" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "SchoolName",
      nextQuestion: "SchoolType",
      title: "What is the name of your school?",
      textInput: {
        placeholder: "School name",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "SchoolType",
      nextQuestion: "NumPeople",
      title: "What type of school do you attend?",
      optionList: {
        options: [
          "elementary",
          "middle",
          "highSchool",
          "college",
          "tradeSchool",
          "other",
        ],
        multiSelect: true,
        numColumns: 2,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "NumPeople",
      nextQuestion: "FluShot",
      title:
        "During a normal day, how many people are you around (within 6 feet for more than 2 minutes)?",
      optionList: {
        options: ["1to5people", "6to10people", "moreThan10people"],
        multiSelect: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "FluShot",
      conditionalNext: {
        buttonKeys: new Map([["yes", "VaccineDate"]]),
      },
      nextQuestion: "FirstSick",
      title: "Did you get a flu shot in the last year?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "VaccineDate",
      nextQuestion: "FirstSick",
      title: "What was the date of vaccination?",
      dateInput: {
        autoFocus: false,
        placeholder: "Date",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withDate" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "FirstSick",
      nextQuestion: "Antibiotics",
      title: "What day did you start to feel sick?",
      dateInput: {
        autoFocus: false,
        placeholder: "Date",
      },
      buttons: [{ key: "done", primary: true, enabled: "withDate" }],
    },
  },
  {
    section: hist,
    data: {
      id: "Antibiotics",
      nextQuestion: "Antivirals",
      title: "Did you take antibiotics for this current illness/cold?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "Antivirals",
      nextQuestion: "DailyInterference",
      title:
        "Did you take an antiviral (like tamiflu) for this current illness/cold?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "DailyInterference",
      nextQuestion: "DoctorThisWeek",
      title:
        "Is your cold stopping you from doing things you would usually do?",
      buttons: [
        { key: "yesLot", primary: true, enabled: true },
        { key: "yesLittle", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "DoctorThisWeek",
      nextQuestion: "DoctorThisYear",
      title: "Have you seen a doctor for your cold this week?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "DoctorThisYear",
      nextQuestion: "AssignedSex",
      title:
        "In the last year, how many times have you been to a doctor for a cough or a cold?",
      optionList: {
        options: ["1to5times", "6to10times", "moreThan10times", "none"],
        multiSelect: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: demo,
    data: {
      id: "AssignedSex",
      conditionalNext: {
        buttonKeys: new Map([["female", "Pregnant"]]),
      },
      nextQuestion: "Race",
      title: "What was your assigned sex at birth?",
      buttons: [
        { key: "male", primary: true, enabled: true },
        { key: "female", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: demo,
    data: {
      id: "Pregnant",
      nextQuestion: "Race",
      title: "Are you currently pregnant?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: demo,
    data: {
      id: "Race",
      nextQuestion: "HispanicLatino",
      title: "How would you describe your race",
      description: "Please select all that apply",
      optionList: {
        options: [
          "americanIndianOrAlaskaNative",
          "asian",
          "nativeHawaiian",
          "blackOrAfricanAmerican",
          "white",
          "other",
        ],
        multiSelect: true,
        withOther: true,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: demo,
    data: {
      id: "HispanicLatino",
      nextQuestion: "MedicalInsurance",
      title: "Are you Hispanic or Latino?",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: demo,
    data: {
      id: "MedicalInsurance",
      title: "Do you have medical insurance?",
      description: "Please select all that apply.",
      optionList: {
        options: ["none", "medicaid", "privateInsurance", "medicare", "other"],
        multiSelect: true,
        withOther: true,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
];
