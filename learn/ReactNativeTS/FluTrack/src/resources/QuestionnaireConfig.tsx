const birth = "birth";
const comp = "comp";
const expo = "expo";
const hist = "hist";
const demo = "demo";

export const sectionDescriptions = new Map<string, string>([
  [hist, "histSection"],
  [demo, "demoSection"],
]);

export interface SurveyQuestionData {
  addressInput?: AddressInputConfig;
  buttons: ButtonConfig[];
  conditionalNext?: ConditionalNextConfig;
  id: string;
  dateInput?: DateInputConfig;
  description?: DescriptionConfig;
  nextQuestion?: string | null;
  numberInput?: NumberInputConfig;
  numberSelector?: NumberSelectorConfig;
  optionList?: OptionListConfig;
  textInput?: TextInputConfig;
  title?: string;
}

interface AddressInputConfig {
  showLocationField: boolean;
}

export interface ButtonConfig {
  key: string;
  primary: boolean;
  enabled: EnabledOption;
  subtextKey?: string;
}

interface ConditionalNextConfig {
  buttonAndLocation?: boolean;
  buttonKeys?: Map<string, string>;
  location?: Map<string, string>;
  options?: Map<string, string>;
}

interface DateInputConfig {
  mode: "day" | "month";
  placeholder: string;
}

interface NumberInputConfig {
  placeholder: string;
}

interface NumberSelectorConfig {
  min: number;
  max: number;
  placeholder: string;
  maxPlus: boolean;
}

interface DescriptionConfig {
  label: string;
  center?: boolean;
}

export interface OptionListConfig {
  options: string[];
  multiSelect: boolean;
  numColumns?: number;
  withOther: boolean;
  defaultOptions?: string[];
}

interface TextInputConfig {
  placeholder: string;
}

export type EnabledOption =
  | true
  | false
  | "withOption"
  | "withText"
  | "withAddress"
  | "withNumber"
  | "withDate";

export interface SurveyQuestion {
  section: string;
  data: SurveyQuestionData;
}

export const questionnaire: SurveyQuestion[] = [
  {
    section: birth,
    data: {
      id: "BirthDate",
      nextQuestion: "WhereLive",
      title: "birth",
      dateInput: {
        mode: "day",
        placeholder: "selectDate",
      },
      buttons: [{ key: "done", primary: true, enabled: "withDate" }],
    },
  },
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
        location: new Map([["collegeCampus", "AddressCampus"]]),
      },
      nextQuestion: "Address",
      title: "whereLive",
      optionList: {
        options: [
          "house",
          "assistedLiving",
          "shelter",
          "skilledNursingCenter",
          "apartment",
          "noneOfTheAbove",
          "dormitory",
        ],
        multiSelect: false,
        numColumns: 2,
        withOther: false,
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
      conditionalNext: {
        location: new Map([["collegeCampus", "AddressCampus"]]),
      },
      title: "howManyBedrooms",
      optionList: {
        options: [
          "1bedroom",
          "2bedrooms",
          "3bedrooms",
          "4bedrooms",
          "moreThan4Bedrooms",
        ],
        multiSelect: false,
        withOther: false,
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
      conditionalNext: {
        location: new Map([["collegeCampus", "AddressCampus"]]),
      },
      title: "bedAssignment",
      numberInput: {
        placeholder: "bedAssignment",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withNumber" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "none", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: comp,
    data: {
      id: "Address",
      nextQuestion: "ExpoDesc",
      title: "address",
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
    section: comp,
    data: {
      id: "AddressCampus",
      nextQuestion: "ExpoDesc",
      title: "addressCampus",
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
      description: {
        label: "expoToSickPeople",
        center: false,
      },
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
      title: "nearSickPeople",
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
      title: "coughSneeze",
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
      id: "NearChildren",
      nextQuestion: "HaveChildren",
      title: "contactWithChildren",
      optionList: {
        options: ["1child", "2to5children", "moreThan5children", "none"],
        multiSelect: false,
        withOther: false,
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
      id: "HaveChildren",
      nextQuestion: "Smoke",
      title: "haveChildren",
      conditionalNext: {
        buttonKeys: new Map([["yes", "ChildrenNearChildren"]]),
      },
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
      id: "ChildrenNearChildren",
      nextQuestion: "Smoke",
      title: "childrenWithChildren",
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
      title: "smokeOrVape",
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
      nextQuestion: "RecentTravel",
      conditionalNext: {
        location: new Map([["collegeCampus", "DrinkAlcohol"]]),
      },
      title: "householdSmoke",
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
      id: "DrinkAlcohol",
      nextQuestion: "RecentTravel",
      conditionalNext: {
        buttonKeys: new Map([["yes", "HowManyDrinks"]]),
      },
      title: "drinkAlcohol",
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
      id: "HowManyDrinks",
      nextQuestion: "RecentTravel",
      title: "howManyDrinks",
      numberInput: {
        placeholder: "drinks",
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
      id: "ArrivedFrom",
      // TODO: figure out how to determine if they arrived from outside of wa,
      // add conditional next if within to RecentTravel default to TimeSpent
      nextQuestion: "RecentTravel",
      title: "arrivedFrom",
      textInput: {
        placeholder: "city",
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
      title: "travelledLastMonth",
      optionList: {
        options: [
          "withinWashingtonStateOnly",
          "toAnotherUSState",
          "toAnotherCountry",
        ],
        multiSelect: true,
        withOther: false,
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
        options: new Map([["work", "Occupation"], ["school", "SchoolType"]]),
      },
      nextQuestion: "NumPeople",
      title: "majorityOfTime",
      optionList: {
        options: ["work", "school", "home", "other"],
        multiSelect: false,
        withOther: false,
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
      title: "occupation",
      textInput: {
        placeholder: "occupation",
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
      title: "workAddress",
      addressInput: {
        showLocationField: true,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withAddress" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "HoursWorked",
      nextQuestion: "NumPeople",
      title: "hoursWorked",
      numberSelector: {
        min: 0,
        max: 15,
        maxPlus: true,
        placeholder: "numHours",
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
      id: "SchoolType",
      nextQuestion: "SchoolName",
      title: "schoolType",
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
        withOther: false,
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
      id: "SchoolName",
      nextQuestion: "NumPeople",
      title: "schoolName",
      textInput: {
        placeholder: "schoolName",
      },
      conditionalNext: {
        location: new Map([["collegeCampus", "Major"]]),
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
      id: "Major",
      nextQuestion: "CampusBuilding",
      title: "major",
      textInput: {
        placeholder: "Major",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "na", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "CampusBuilding",
      nextQuestion: "NumPeople",
      title: "campusBuilding",
      description: {
        label: "top3",
        center: true,
      },
      optionList: {
        options: [
          "artLibaray",
          "bagley",
          "builtLib",
          "burke",
          "cse",
          "engLib",
          "healthSci",
          "hecEd",
          "hitchcock",
          "huskeyStadium",
          "hub",
          "ima",
          "lifeSciences",
          "maryGates",
          "meany",
          "moles",
          "oceanSciences",
          "odegaard",
          "paccar",
          "physicsAstron",
          "suzzallo",
          "foege",
          "willGates",
          "other",
        ],
        multiSelect: true,
        numColumns: 3,
        withOther: true,
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
      title: "peopleCloseTo",
      optionList: {
        options: ["1to5people", "6to10people", "moreThan10people"],
        multiSelect: false,
        withOther: false,
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
      nextQuestion: "DaysSick",
      title: "fluShot",
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
      nextQuestion: "VaccineLocation",
      title: "vacDate",
      dateInput: {
        mode: "month",
        placeholder: "selectMonth",
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
      id: "VaccineLocation",
      nextQuestion: "DaysSick",
      title: "vacLocation",
      optionList: {
        options: ["pharmacy", "clinic", "workplace", "school", "other"],
        multiSelect: false,
        withOther: true,
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
      id: "DaysSick",
      nextQuestion: "DailyInterference",
      title: "daysSick",
      numberSelector: {
        min: 1,
        max: 7,
        maxPlus: true,
        placeholder: "days",
      },
      buttons: [{ key: "done", primary: true, enabled: "withNumber" }],
    },
  },
  {
    section: hist,
    data: {
      id: "DailyInterference",
      nextQuestion: "DoctorThisWeek",
      title: "interferring",
      conditionalNext: {
        buttonAndLocation: true,
        buttonKeys: new Map([
          ["yesLot", "KeptFrom"],
          ["yesLittle", "KeptFrom"],
        ]),
        location: new Map([["collegeCampus", "KeptFrom"]]),
      },
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
      id: "KeptFrom",
      nextQuestion: "DoctorThisWeek",
      title: "keptFrom",
      optionList: {
        options: [
          "attendingClass",
          "goingToWork",
          "goingToASocialEvent",
          "studying",
          "performingWell",
        ],
        multiSelect: true,
        withOther: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "na", primary: false, enabled: true },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "DoctorThisWeek",
      nextQuestion: "Antibiotics",
      title: "seenADoc",
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
      id: "Antibiotics",
      nextQuestion: "MedConditions",
      title: "antibiotics",
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
      id: "MedConditions",
      nextQuestion: "AssignedSex",
      title: "medConditions",
      optionList: {
        options: ["asthma", "copd"],
        multiSelect: true,
        withOther: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "no", primary: true, enabled: true },
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
      title: "assignedSex",
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
      title: "pregnant",
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
      title: "race",
      description: {
        label: "selectAll",
        center: true,
      },
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
      title: "hispanicLatino",
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
      title: "medInsurance",
      description: {
        label: "selectAll",
        center: true,
      },
      nextQuestion: null,
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
