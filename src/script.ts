import path from "path";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";

async function runSample() {
  const authClient = await authenticate({
    keyfilePath: path.resolve(process.cwd(), "credentials.json"),
    scopes: "https://www.googleapis.com/auth/forms.body",
  });

  const { forms } = google.forms({
    version: "v1",
    auth: authClient,
  });

  const createResponse = await forms.create({
    requestBody: {
      info: {
        title: "Creating a new form in Node with Typescript",
      },
    },
  });

  // res.data выглядит вот так
  // {
  //   formId: '1cbMJQgOlb2mlrOg3ip58LmXQ7CoHkJrC9HFqwf0RQpQ',
  //   info: { title: 'TITLE', documentTitle: 'Untitled form' },
  //   settings: { emailCollectionType: 'DO_NOT_COLLECT' },
  //   revisionId: '00000002',
  //   responderUri: 'https://docs.google.com/forms/d/e/1FAIpQLSdS2WRuC0w5wZ__m1RLBdfckWaM6ynfAXeN1sT6C7SbDLwd8g/viewform',
  //   publishSettings: { publishState: { isPublished: true, isAcceptingResponses: true } }
  // }

  const formId = createResponse.data.formId;

  if (!formId) {
    throw new Error("formId is null or undefined");
  }

  //
  const formToQuiz = await forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          updateSettings: {
            settings: {
              quizSettings: {
                isQuiz: true,
              },
            },
            updateMask: "quizSettings.isQuiz",
          },
        },
      ],
    },
  });

  // Update form description
  const formDescription = await forms.batchUpdate({
    formId: formId,
    requestBody: {
      requests: [
        {
          updateFormInfo: {
            info: {
              description:
                "Please complete this quiz based on this week's readings for class.",
            },
            updateMask: "description",
          },
        },
      ],
    },
  });

  const formQuestions = await forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          createItem: {
            item: {
              title:
                "Which of these singers was not a member of Destiny's Child?",
              questionItem: {
                question: {
                  required: true,
                  grading: {
                    pointValue: 1,
                    correctAnswers: {
                      answers: [{ value: "Rihanna" }],
                    },
                    whenRight: { text: "You got it!" },
                    whenWrong: { text: "Sorry, that's wrong" },
                  },
                  choiceQuestion: {
                    type: "RADIO",
                    options: [
                      { value: "Kelly Rowland" },
                      { value: "Beyoncé" },
                      { value: "Rihanna" },
                      { value: "Michelle Williams" },
                    ],
                  },
                },
              },
            },
            location: {
              index: 0,
            },
          },
        },
      ],
    },
  });

  console.log(formQuestions.data);

  return formQuestions.data;
}

runSample();
