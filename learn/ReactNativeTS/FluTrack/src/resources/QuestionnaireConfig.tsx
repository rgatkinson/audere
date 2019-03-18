import { ImageSourcePropType } from "react-native";
import { AgeBuckets } from "./ScreenConfig";

const birth = "birth";
const comp = "comp";
const expo = "expo";
const hist = "hist";
const demo = "demo";
const travel = "travel";
const geography = "geography";

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
  image?: ImageConfig;
  description?: DescriptionConfig;
  nextQuestion?: string | null;
  numberInput?: NumberInputConfig;
  numberSelector?: NumberSelectorConfig;
  countrySelector?: CountrySelectorConfig;
  optionList?: OptionListConfig;
  textInput?: TextInputConfig;
  title?: string;
}

interface AddressInputConfig {
  showLocationField: boolean;
  countryValueFrom?: string; // Question key whose textInput answer should be used as country
}

export interface ButtonConfig {
  key: string;
  primary: boolean;
  enabled: EnabledOption;
  subtextKey?: string;
}

interface ConditionalNextConfig {
  buttonAndLocation?: boolean;
  locationFirst?: Map<string, string>; // HACK to workaround age being higher precedence than location
  buttonKeys?: Map<string, string>;
  location?: Map<string, string>;
  options?: Map<string, string>;
  text?: Map<string, string>;
  age?: Map<string, string>;
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

interface CountrySelectorConfig {
  placeholder: string;
}

interface ImageConfig {
  label: string;
  src: ImageSourcePropType;
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
  otherPlaceholder?: string;
  exclusiveOption?: string;
  inclusiveOption?: string;
}

interface TextInputConfig {
  autoCorrect?: boolean;
  placeholder: string;
}

export type EnabledOption =
  | true
  | false
  | "withOption"
  | "withOtherOption"
  | "withText"
  | "withAddress"
  | "withNumber"
  | "withNumberAndOption"
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
      conditionalNext: {
        location: new Map([["port", "FluShot"]]),
      },
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
          ["house", "PeopleInHousehold"],
          ["apartment", "PeopleInHousehold"],
          ["shelter", "WhichShelter"],
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
      buttons: [{ key: "done", primary: true, enabled: "withOption" }],
    },
  },
  {
    section: comp,
    data: {
      id: "PeopleInHousehold",
      nextQuestion: "Bedrooms",
      title: "peopleInHousehold",
      numberSelector: {
        min: 1,
        max: 8,
        maxPlus: true,
        placeholder: "numPeople",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withNumber" },
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
      id: "WhichShelter",
      nextQuestion: "AddressOtherShelter",
      conditionalNext: {
        options: new Map([
          ["pioneerSquare", "HowLongHomeless"],
          ["stMartins", "HowLongHomeless"],
        ]),
      },
      title: "whichShelter",
      optionList: {
        options: ["pioneerSquare", "stMartins", "other"],
        multiSelect: false,
        withOther: true,
        otherPlaceholder: "shelter",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "none", primary: false, enabled: true },
      ],
    },
  },
  {
    section: comp,
    data: {
      id: "AddressOtherShelter",
      nextQuestion: "HowLongHomeless",
      description: {
        label: "homeAddressDescription",
        center: false,
      },
      title: "address",
      addressInput: {
        showLocationField: false,
      },
      buttons: [{ key: "done", primary: true, enabled: "withAddress" }],
    },
  },
  {
    section: comp,
    data: {
      id: "HowLongHomeless",
      nextQuestion: "HowLongShelter",
      title: "howLongHomeless",
      description: {
        label: "homelessDesc",
        center: true,
      },
      optionList: {
        options: ["6monthsLess", "7to12months", "13to24months", "over24months"],
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
    section: comp,
    data: {
      id: "HowLongShelter",
      nextQuestion: "HowManyNights",
      title: "howLongShelter",
      numberSelector: {
        min: 0,
        max: 30,
        maxPlus: true,
        placeholder: "selectNumber",
      },
      optionList: {
        options: ["days", "weeks", "months", "years"],
        multiSelect: false,
        numColumns: 2,
        withOther: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withNumberAndOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: comp,
    data: {
      id: "HowManyNights",
      nextQuestion: "BedAssignment",
      title: "howManyNights",
      numberSelector: {
        min: 0,
        max: 30,
        maxPlus: true,
        placeholder: "selectNumber",
      },
      optionList: {
        options: ["days", "weeks", "months", "years"],
        multiSelect: false,
        numColumns: 2,
        withOther: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withNumberAndOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: comp,
    data: {
      id: "BedAssignment",
      nextQuestion: "OtherShelters",
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
      id: "OtherShelters",
      nextQuestion: "ExpoDesc",
      title: "otherShelters",
      description: {
        label: "selectAll",
        center: true,
      },
      optionList: {
        options: [
          "pikeMarket",
          "lazarusDay",
          "gospelMissionMensShelter",
          "gospelMissionCapHill",
          "marysPlace",
          "breadOfLife",
          "seattleLibrary",
          "other",
        ],
        multiSelect: true,
        withOther: true,
        numColumns: 2,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
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
      description: {
        label: "homeAddressDescription",
        center: false,
      },
      title: "address",
      addressInput: {
        showLocationField: false,
      },
      buttons: [{ key: "done", primary: true, enabled: "withAddress" }],
    },
  },
  {
    section: comp,
    data: {
      id: "AddressCampus",
      nextQuestion: "ExpoDesc",
      title: "address",
      description: {
        label: "campusDescription",
        center: false,
      },
      addressInput: {
        showLocationField: false,
      },
      buttons: [{ key: "done", primary: true, enabled: "withAddress" }],
    },
  },
  {
    section: expo,
    data: {
      id: "ExpoDesc",
      image: {
        label: "6feet",
        src: require("../img/6ftDiagram.png"),
      },
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
      nextQuestion: "ChildrenNearChildren",
      conditionalNext: {
        locationFirst: new Map([["fredHutch", "StaffHutchKids"]]),
        age: new Map([[AgeBuckets.Over18, "HaveChildren"]]),
      },
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
      id: "StaffHutchKids",
      nextQuestion: "ChildrenNearChildren",
      conditionalNext: {
        age: new Map([[AgeBuckets.Over18, "HaveChildren"]]),
      },
      title: "staffHutchKids",
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
      conditionalNext: {
        locationFirst: new Map([["fredHutch", "ChildrenHutchKids"]]),
        age: new Map([
          [AgeBuckets.Child, "HouseholdSmoke"],
          [AgeBuckets.Under7, "HouseholdSmoke"],
        ]),
      },
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
      id: "ChildrenHutchKids",
      nextQuestion: "Smoke",
      conditionalNext: {
        age: new Map([
          [AgeBuckets.Child, "HouseholdSmoke"],
          [AgeBuckets.Under7, "HouseholdSmoke"],
        ]),
      },
      title: "childrenHutchKids",
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
      id: "Smoke",
      nextQuestion: "HouseholdSmoke",
      conditionalNext: {
        location: new Map([["homelessShelter", "ShelterDrinkAlcohol"]]),
      },
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
        age: new Map([
          [AgeBuckets.Teen, "DrinkAlcohol"],
          [AgeBuckets.Over18, "DrinkAlcohol"],
        ]),
        location: new Map([
          ["childrensClinic", "ChildrensRecentTravel"],
          ["childrensHospital", "ChildrensRecentTravel"],
          ["childcare", "ChildrensRecentTravel"],
        ]),
      },
      title: "householdSmoke",
      buttons: [
        { key: "yes", primary: true, enabled: true },
        { key: "no", primary: true, enabled: true },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "na", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: expo,
    data: {
      id: "ShelterDrinkAlcohol",
      nextQuestion: "ShelterOtherDrugs",
      conditionalNext: {
        buttonKeys: new Map([["yes", "ShelterHowManyDrinks"]]),
      },
      title: "shelterDrinkAlcohol",
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
      id: "ShelterHowManyDrinks",
      nextQuestion: "ShelterOtherDrugs",
      title: "shelterHowManyDrinks",
      optionList: {
        options: ["onceMonthLess", "2to4month", "2to3week", "4orMoreWeek"],
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
      id: "ShelterOtherDrugs",
      nextQuestion: "RecentTravel",
      conditionalNext: {
        buttonKeys: new Map([["yes", "ShelterWhatDrugs"]]),
      },
      title: "shelterOtherDrugs",
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
      id: "ShelterWhatDrugs",
      nextQuestion: "ShelterInject",
      title: "shelterWhatDrugs",
      optionList: {
        options: [
          "heroin",
          "meth",
          "morphine",
          "opioids",
          "cocaine",
          "tranquilizers",
          "ecstasy",
          "other",
        ],
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
  {
    section: expo,
    data: {
      id: "ShelterInject",
      nextQuestion: "RecentTravel",
      title: "shelterInject",
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
        location: new Map([
          ["childrensClinic", "ChildrensRecentTravel"],
          ["childrensHospital", "ChildrensRecentTravel"],
          ["childcare", "ChildrensRecentTravel"],
        ]),
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
      conditionalNext: {
        location: new Map([
          ["childrensClinic", "ChildrensRecentTravel"],
          ["childrensHospital", "ChildrensRecentTravel"],
          ["childcare", "ChildrensRecentTravel"],
        ]),
      },
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
      id: "RecentTravel",
      nextQuestion: "TimeSpent",
      conditionalNext: {
        options: new Map([
          ["toAnotherUSState", "WhereTravelled"],
          ["toAnotherCountry", "WhereTravelled"],
        ]),
        location: new Map([["fredHutch", "FredHutchEmployee"]]),
      },
      title: "travelledLastMonth",
      optionList: {
        options: [
          "withinWashingtonStateOnly",
          "toAnotherUSState",
          "toAnotherCountry",
        ],
        multiSelect: true,
        withOther: false,
        exclusiveOption: "withinWashingtonStateOnly",
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
      id: "WhereTravelled",
      nextQuestion: "WhenTravelled",
      title: "whereTravelled",
      description: {
        label: "comma",
        center: true,
      },
      textInput: {
        autoCorrect: false,
        placeholder: "locations",
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
      id: "WhenTravelled",
      nextQuestion: "TimeSpent",
      conditionalNext: {
        location: new Map([["fredHutch", "FredHutchEmployee"]]),
      },
      title: "whenTravelled",
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
      id: "ChildrensRecentTravel",
      nextQuestion: "TimeSpent",
      conditionalNext: {
        options: new Map([
          ["toAnotherUSState", "ChildrensWhereTravelled"],
          ["toAnotherCountry", "ChildrensWhereTravelled"],
        ]),
      },
      title: "childrensTravelledLastMonth",
      optionList: {
        options: [
          "withinWashingtonStateOnly",
          "toAnotherUSState",
          "toAnotherCountry",
        ],
        multiSelect: true,
        withOther: false,
        exclusiveOption: "withinWashingtonStateOnly",
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
      id: "ChildrensWhereTravelled",
      nextQuestion: "WhenTravelled",
      title: "childrensWhereTravelled",
      description: {
        label: "comma",
        center: true,
      },
      textInput: {
        autoCorrect: false,
        placeholder: "locations",
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
      id: "FredHutchEmployee",
      nextQuestion: "TimeSpent",
      conditionalNext: {
        buttonKeys: new Map([["yes", "Occupation"]]),
      },
      title: "fredHutchEmployee",
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
      id: "TimeSpent",
      conditionalNext: {
        options: new Map([["work", "Occupation"], ["school", "SchoolType"]]),
        location: new Map([["collegeCampus", "Major"]]),
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
      description: {
        label: "occupationDescription",
        center: true,
      },
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
      description: {
        label: "workAddressDescription",
        center: false,
      },
      addressInput: {
        showLocationField: true,
      },
      buttons: [{ key: "done", primary: true, enabled: "withAddress" }],
    },
  },
  {
    section: expo,
    data: {
      id: "HoursWorked",
      nextQuestion: "NumPeople",
      conditionalNext: {
        location: new Map([["collegeCampus", "Major"]]),
      },
      title: "hoursWorked",
      numberSelector: {
        min: 1,
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
          "childcareCenter",
          "preschool",
          "other",
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
    section: expo,
    data: {
      id: "SchoolName",
      nextQuestion: "NumPeople",
      title: "schoolName",
      textInput: {
        autoCorrect: false,
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
      description: {
        label: "comma",
        center: true,
      },
      textInput: {
        placeholder: "Major",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "doNotKnowUndecided", primary: false, enabled: true },
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
          "artLibrary",
          "bagley",
          "builtLib",
          "burke",
          "cse",
          "engLib",
          "healthSci",
          "hecEd",
          "hitchcock",
          "huskyStadium",
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
        otherPlaceholder: "building",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOtherOption" },
        { key: "na", primary: false, enabled: true },
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
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "VaccineDate",
      conditionalNext: {
        location: new Map([["port", "DaysSick"]]),
      },
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
        otherPlaceholder: "location",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOtherOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: hist,
    data: {
      id: "DaysSick",
      conditionalNext: {
        location: new Map([["port", "AssignedSexAirport"]]),
      },
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
      description: {
        label: "selectAll",
        center: true,
      },
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
      description: {
        label: "selectAll",
        center: true,
      },
      optionList: {
        options: ["asthma", "copd", "chronicBronchitis", "cancer", "diabetes"],
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
      nextQuestion: "Race",
      conditionalNext: {
        location: new Map([["port", "Race"]]),
        age: new Map([[AgeBuckets.Child, "Race"], [AgeBuckets.Under7, "Race"]]),
        buttonKeys: new Map([["female", "Pregnant"]]),
      },
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
      id: "AssignedSexAirport",
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
        otherPlaceholder: "race",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOtherOption" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: demo,
    data: {
      id: "HispanicLatino",
      nextQuestion: "MedicalInsurance",
      conditionalNext: {
        location: new Map([
          ["homelessShelter", "WhereBorn"],
          ["port", "WhereTravelled14"],
        ]),
      },
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
      id: "WhereBorn",
      nextQuestion: "TimeUS",
      conditionalNext: {
        text: new Map([["United States", "MedicalInsurance"]]),
      },
      title: "whereBorn",
      countrySelector: {
        placeholder: "selectCountry",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: demo,
    data: {
      id: "TimeUS",
      nextQuestion: "MedicalInsurance",
      title: "timeUS",
      optionList: {
        options: ["lessThan1", "1to5", "6to10", "11to15", "moreThan15"],
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
        options: ["noInsurance", "privateInsurance", "government", "other"],
        multiSelect: true,
        withOther: true,
        otherPlaceholder: "insurance",
        exclusiveOption: "noInsurance",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOtherOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: travel,
    data: {
      id: "WhereTravelled14",
      nextQuestion: "AirlineFlightNum",
      title: "whereTravelled14",
      conditionalNext: {
        options: new Map([
          ["toAnotherUSState+toAnotherCountry", "StatesThenCountriesVisited"], // HACK
          ["toAnotherUSState", "StatesVisited"],
          ["toAnotherCountry", "CountriesVisited"],
        ]),
      },
      optionList: {
        options: [
          "withinWashingtonStateOnly",
          "toAnotherUSState",
          "toAnotherCountry",
        ],
        multiSelect: true,
        withOther: false,
        exclusiveOption: "withinWashingtonStateOnly",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withOption" },
        { key: "doNotKnow", primary: false, enabled: true },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: travel,
    data: {
      id: "StatesVisited",
      nextQuestion: "AirlineFlightNum",
      title: "statesVisited",
      description: {
        label: "statesVisitedDescription",
        center: true,
      },
      textInput: {
        autoCorrect: false,
        placeholder: "states",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: travel,
    data: {
      id: "StatesThenCountriesVisited", // HACK for alternate nextQuestion
      nextQuestion: "CountriesVisited",
      title: "statesVisited",
      description: {
        label: "statesVisitedDescription",
        center: true,
      },
      textInput: {
        autoCorrect: false,
        placeholder: "states",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: travel,
    data: {
      id: "CountriesVisited",
      nextQuestion: "AirlineFlightNum",
      title: "countriesVisited",
      description: {
        label: "countriesVisitedDescription",
        center: true,
      },
      textInput: {
        autoCorrect: false,
        placeholder: "countries",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: travel,
    data: {
      id: "AirlineFlightNum",
      nextQuestion: "CountryResidence",
      title: "airlineFlightNum",
      description: {
        label: "airlineFlightNumDescription",
        center: true,
      },
      textInput: {
        autoCorrect: false,
        placeholder: "airlineFlightNum",
      },
      buttons: [
        { key: "done", primary: true, enabled: "withText" },
        { key: "preferNotToSay", primary: false, enabled: true },
      ],
    },
  },
  {
    section: geography,
    data: {
      id: "CountryResidence",
      nextQuestion: "AddressCountryResidence",
      title: "countryResidence",
      countrySelector: {
        placeholder: "selectCountry",
      },
      buttons: [{ key: "done", primary: true, enabled: "withText" }],
    },
  },
  {
    section: geography,
    data: {
      id: "AddressCountryResidence",
      nextQuestion: "AddressNextWeek",
      description: {
        label: "addressCountryResidenceDescription",
        center: false,
      },
      title: "addressCountryResidence",
      addressInput: {
        showLocationField: false,
        countryValueFrom: "CountryResidence",
      },
      buttons: [{ key: "done", primary: true, enabled: "withAddress" }],
    },
  },
  {
    section: geography,
    data: {
      id: "AddressNextWeek",
      nextQuestion: null,
      title: "addressNextWeek",
      addressInput: {
        showLocationField: false,
      },
      buttons: [
        { key: "done", primary: true, enabled: "withAddress" },
        { key: "sameAsResidence", primary: false, enabled: true },
      ],
    },
  },
];
