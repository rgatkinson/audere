// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { FollowUpSurveyData } from "../external/redCapClient";
import { Response } from "audere-lib/hutchProtocol";

export function mapSurvey(input: FollowUpSurveyData): Response[] {
  const responses: Response[] = [];

  responses.push({
    question: {
      token: "daily_activity",
      text:
        "Over the last week, did your illness prevent you from going to work or school, going to a social event, or exercising/working out?"
    },
    options: [
      {
        token: "no",
        text: "No"
      },
      {
        token: "yes",
        text: "Yes"
      }
    ],
    answer: {
      type: "Option",
      chosenOptions: [input.daily_activity]
    }
  });

  responses.push({
    question: {
      token: "medications",
      text:
        "Are you currently taking antibiotics (e.g. Amoxiil, penicilin, Z-pack, Bactrim, Agumentin) or antivirals (e.g. Tamiflu, Xofluza, Relenza) for this illness?"
    },
    options: [
      {
        token: "yes",
        text: "Yes"
      },
      {
        token: "no",
        text: "No"
      },
      {
        token: "doNotKnow",
        text: "Do not Know"
      }
    ],
    answer: {
      type: "Option",
      chosenOptions: [input.medications - 1]
    }
  });

  const selectedOptions: number[] = [];

  const careAnswers = [
    input.care___1,
    input.care___2,
    input.care___3,
    input.care___4,
    input.care___5,
    input.care___6,
    input.care___7,
    input.care___8
  ];

  for (let i = 0; i < careAnswers.length; i++) {
    if (careAnswers[i] === 1) {
      selectedOptions.push(i);
    }
  }

  responses.push({
    question: {
      token: "care",
      text:
        "In the last week did you go to any of the following for health care treatment or advice about your illness? (Select any you visited or received advice from)"
    },
    options: [
      {
        token: "care___1",
        text: "Pharmacy"
      },
      {
        token: "care___2",
        text: "Primary care clinic"
      },
      {
        token: "care___3",
        text: "Urgent care clinic"
      },
      {
        token: "care___4",
        text: "Naturopath"
      },
      {
        token: "care___5",
        text: "Online health care provider"
      },
      {
        token: "care___6",
        text: "Emergency department"
      },
      {
        token: "care___7",
        text: "Other"
      },
      {
        token: "care___8",
        text: "None of the above"
      }
    ],
    answer: {
      type: "Option",
      chosenOptions: selectedOptions
    }
  });

  if (input.care_other != null) {
    responses.push({
      question: {
        token: "care_other",
        text: `Please describie the "Other" health care treatment or advice you received.`
      },
      answer: {
        type: "String",
        value: input.care_other
      }
    });
  }

  responses.push({
    question: {
      token: "found_study",
      text: "How did you hear about the flu@home study?"
    },
    options: [
      {
        token: "onlineSearch",
        text: "Online search"
      },
      {
        token: "couponSite",
        text: "Coupon site"
      },
      {
        token: "appStore",
        text: "App Store"
      },
      {
        token: "fluNearYou",
        text: "Flu Near You community"
      },
      {
        token: "friend",
        text: "A friend"
      },
      {
        token: "onlineAd",
        text: "Other online ad"
      },
      {
        token: "localClinic",
        text: "Local health clinic"
      },
      {
        token: "other",
        text: "Other"
      }
    ],
    answer: {
      type: "Option",
      chosenOptions: [input.found_study - 1]
    }
  });

  return responses;
}
