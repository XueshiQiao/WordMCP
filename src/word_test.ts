import z from "zod";
import { WordSchema, Word } from "./word.js";

try {
  const validWordJSON = {
    word: "Middle Kingdom",
    pronunciation: "/ˈmɪdl ˈkɪŋdəm/",
    definition: "n. 中国（特指供应链扎根的中央王国）",
    context:
      "As Mr McGee points out, even if Apple’s final assembly moves to India and elsewhere, the supply chain’s roots remain deeply embedded in the Middle Kingdom.",
    other_definitions: [
      "n. 古埃及历史中的中间期王朝",
      "n. 中世纪欧洲对神圣罗马帝国的别称",
    ],
    id: 0,
  };
  const testWord = WordSchema.parse(validWordJSON);
  console.log(testWord);
} catch (error) {
  console.error(error);
}

try {
  const invalidWordJSON = {
    word: "Middle Kingdom",
    pronunciation: null,
    definition: "n. 中国（特指供应链扎根的中央王国）",
    context:
      "As Mr McGee points out, even if Apple’s final assembly moves to India and elsewhere, the supply chain’s roots remain deeply embedded in the Middle Kingdom.",
    other_definitions: [
      "n. 古埃及历史中的中间期王朝",
      "n. 中世纪欧洲对神圣罗马帝国的别称",
    ],
    id: 0,
  };
  const testWord = WordSchema.parse(invalidWordJSON);
  console.log(testWord);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(error.errors);
  } else {
    console.error(error);
  }
}
