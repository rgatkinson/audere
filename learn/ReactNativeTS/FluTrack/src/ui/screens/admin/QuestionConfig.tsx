type AdminQuestionType = {
  id: string;
  nextQuestion?: string;
  title: string;
  optionList: { options: string[]; multiSelect: boolean; withOther: boolean };
};
export const PostCollectionQuestions = {
  WereThereAdverse: {
    id: "WereThereAdverse",
    nextQuestion: "WhichProcedures",
    title:
      "Were there any adverse events experienced from the last collection?",
    optionList: {
      options: ["Yes", "No"],
      multiSelect: false,
      withOther: false,
    },
  },
  WhichProcedures: {
    id: "WhichProcedures",
    title: "Which procedures had adverse events?",
    optionList: {
      options: ["Blood draw", "Nasal swab"],
      multiSelect: true,
      withOther: false,
    },
  },
  BloodDrawEvents: {
    id: "BloodDrawEvents",
    title: "For blood draw, what were the adverse events?",
    optionList: {
      options: ["Bruising at site", "Infection at site", "Other"],
      multiSelect: true,
      withOther: true,
    },
  },
  NasalSwabEvents: {
    id: "NasalSwabEvents",
    title: "For nasal swab, what were the adverse events?",
    optionList: {
      options: ["Nosebleed", "Other"],
      multiSelect: true,
      withOther: true,
    },
  },
};

export const OptionKeyToQuestion: { [key: string]: AdminQuestionType } = {
  "Blood draw": PostCollectionQuestions.BloodDrawEvents,
  "Nasal swab": PostCollectionQuestions.NasalSwabEvents,
};
