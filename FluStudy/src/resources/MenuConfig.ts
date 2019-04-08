export interface MenuConfig {
  key: string;
  showBuildInfo?: boolean;
}

export const menuScreens: MenuConfig[] = [
  { key: "About" },
  { key: "Funding" },
  { key: "Partners" },
  { key: "GeneralQuestions" },
  { key: "Problems" },
  { key: "TestQuestions" },
  { key: "GiftcardQuestions" },
  { key: "ContactSupport" },
  { key: "Version", showBuildInfo: true },
];
