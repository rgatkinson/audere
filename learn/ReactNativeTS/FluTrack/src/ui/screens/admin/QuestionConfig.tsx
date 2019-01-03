import { SurveyQuestionData } from "../../../resources/QuestionnaireConfig";

export const PostCollectionQuestions = {
  WereThereAdverse: {
    buttons: [],
    id: "WereThereAdverse",
    title:
      "Were there any adverse events experienced from the last collection?",
    optionList: {
      options: ["yes", "no"],
      multiSelect: false,
      withOther: false,
    },
  },
  WhichProcedures: {
    buttons: [],
    id: "WhichProcedures",
    title: "Which procedures had adverse events?",
    optionList: {
      options: ["bloodDraw", "nasalSwab"],
      multiSelect: true,
      withOther: false,
    },
  },
  BloodDrawEvents: {
    buttons: [],
    id: "BloodDrawEvents",
    title: "For blood draw, what were the adverse events?",
    optionList: {
      options: ["bruisingAtSite", "infectionAtSite", "other"],
      multiSelect: true,
      withOther: true,
      otherPlaceholder: "Adverse event",
    },
  },
  NasalSwabEvents: {
    buttons: [],
    id: "NasalSwabEvents",
    title: "For nasal swab, what were the adverse events?",
    optionList: {
      options: ["nosebleed", "other"],
      multiSelect: true,
      withOther: true,
      otherPlaceholder: "Adverse event",
    },
  },
};

export const OptionKeyToQuestion: { [key: string]: SurveyQuestionData } = {
  bloodDraw: PostCollectionQuestions.BloodDrawEvents,
  nasalSwab: PostCollectionQuestions.NasalSwabEvents,
};
