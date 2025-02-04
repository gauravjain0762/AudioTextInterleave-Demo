// Define types for the JSON data
type Phrase = {
  words: string;
  time: number;
};

type Speaker = {
  name: string;
  phrases: Phrase[];
};

type JsonData = {
  pause: number;
  speakers: Speaker[];
};

export const jsonData: JsonData = {
  pause: 250,
  speakers: [
    {
      name: "John",
      phrases: [
        {
          words: "this is one phrase.",
          time: 100,
        },
        {
          words: "now the second phrase.",
          time: 3500,
        },
        {
          words: "end with last phrase.",
          time: 7500,
        },
      ],
    },
    {
      name: "Jack",
      phrases: [
        {
          words: "another speaker here.",
          time: 1500,
        },
        {
          words: "saying her second phrase.",
          time: 5500,
        },
        {
          words: "and eventually finishing up.",
          time: 9000,
        },
      ],
    },
  ],
};

export const audioUrl: string =
  "https://file.notion.so/f/f/24407104-f114-40ec-91ac-25f0ac0ac7a6/66b62104-67d0-48a9-956a-2534f0c1f52a/example_audio.mp3?table=block&id=1832fabc-bb3f-802e-91d5-ed73b3c8711b&spaceId=24407104-f114-40ec-91ac-25f0ac0ac7a6&expirationTimestamp=1738670400000&signature=jmu_e1N1y5FHeAquOsUfuIj98uNzMtUFSfjIFV-W9o0&downloadName=example_audio.mp3";
