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
      options: ["yes", "no"],
      multiSelect: false,
      withOther: false,
    },
  },
  WhichProcedures: {
    id: "WhichProcedures",
    title: "Which procedures had adverse events?",
    optionList: {
      options: ["bloodDraw", "nasalSwab"],
      multiSelect: true,
      withOther: false,
    },
  },
  BloodDrawEvents: {
    id: "BloodDrawEvents",
    title: "For blood draw, what were the adverse events?",
    optionList: {
      options: ["bruisingAtSite", "infectionAtSite", "other"],
      multiSelect: true,
      withOther: true,
    },
  },
  NasalSwabEvents: {
    id: "NasalSwabEvents",
    title: "For nasal swab, what were the adverse events?",
    optionList: {
      options: ["nosebleed", "other"],
      multiSelect: true,
      withOther: true,
    },
  },
};

export const OptionKeyToQuestion: { [key: string]: AdminQuestionType } = {
  bloodDraw: PostCollectionQuestions.BloodDrawEvents,
  nasalSwab: PostCollectionQuestions.NasalSwabEvents,
};
