export interface MenuConfig {
  key: string;
  images?: string[];
  showBuildInfo?: boolean;
  subTitle?: string;
}

export const menuScreens: MenuConfig[] = [
  { key: "About", subTitle: "about" },
  { key: "Funding", subTitle: "about" },
  {
    key: "Partners",
    subTitle: "about",
    images: ["brotman", "uwmed", "fredhutch"],
  },
  { key: "GeneralQuestions", subTitle: "help" },
  { key: "Problems", subTitle: "help" },
  { key: "TestQuestions", subTitle: "help" },
  { key: "GiftcardQuestions", subTitle: "help" },
  { key: "ContactSupport", subTitle: "help" },
  { key: "Version", showBuildInfo: true, subTitle: "help" },
];
