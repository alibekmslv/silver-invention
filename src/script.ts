import { promises as fs } from "fs";
import path from "path";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import { Quiz, QuizSchema } from "./schemas";

async function main() {
  const data = await getData();

  const authClient = await authenticate({
    keyfilePath: path.resolve(process.cwd(), "credentials.json"),
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/forms.body",
    ],
  });

  const { forms } = google.forms({
    version: "v1",
    auth: authClient,
  });

  const response = await forms.create({
    requestBody: {
      info: {
        title: data.title,
        documentTitle: data.title,
      },
    },
  });

  const { formId } = response.data;

  if (!formId) {
    throw new Error("formId is null or undefined");
  }

  // Превращаем форму в квиз
  await forms.batchUpdate({
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

  // Добавляем форме описание
  await forms.batchUpdate({
    formId: formId,
    requestBody: {
      requests: [
        {
          updateFormInfo: {
            info: {
              description: data.description,
            },
            updateMask: "description",
          },
        },
      ],
    },
  });

  await forms.batchUpdate({
    formId,
    requestBody: {
      requests: data.questions.map(({ title, options, answer }, index) => {
        const rightAnswer = options.find(({ option }) => option === answer)
          ?.value!;

        return {
          createItem: {
            item: {
              title: `${index + 1}. ${title}`,
              questionItem: {
                question: {
                  required: true,
                  grading: {
                    pointValue: 1,
                    correctAnswers: {
                      answers: [{ value: `${answer}) ${rightAnswer}` }],
                    },
                    whenRight: { text: "You got it!" },
                    whenWrong: { text: "Sorry, that's wrong" },
                  },
                  choiceQuestion: {
                    type: "RADIO",
                    options: options.map(({ option, value }) => {
                      return {
                        value: `${option}) ${value}`,
                      };
                    }),
                  },
                },
              },
            },
            location: {
              index: index,
            },
          },
        };
      }),
    },
  });

  console.log("Success!");
  console.log(formId);

  return formId;
}

async function getData() {
  const args = process.argv.slice(2);
  const filePathArg = args.find((arg) => arg.startsWith("--filePath="));

  if (!filePathArg) {
    console.log("Флаг --filePath не указан.");
    process.exit(1);
  }

  const filePath = filePathArg.split("=")[1];
  console.log("Файл:", filePath);

  const file = await fs.readFile(process.cwd() + `/${filePath}`, "utf8");
  const rawData: Quiz[] = JSON.parse(file);

  // Валидируем наш .json фаил. Структура должна быть правильной
  const result = QuizSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Ошибка валидации:", result.error.flatten());
    process.exit(1);
  }
  const { data } = result;

  return data;
}

main();
