import i18n from "i18next";
import Expo from "expo";

// creating a language detection plugin using expo
// http://i18next.com/docs/ownplugin/#languagedetector
const languageDetector = {
  type: "languageDetector",
  async: true, // async detection
  detect: callback => {
    return /*'en'; */ Expo.DangerZone.Localization.getCurrentLocaleAsync().then(
      lng => {
        callback(lng.replace("_", "-"));
      }
    );
  },
  init: () => {},
  cacheUserLanguage: () => {},
};
i18n.use(languageDetector).init({
  fallbackLng: "en",
  resources: {
    en: {
      common: {
        validatedInput: {
          id: "id",
          password: "password",
          nonNegativeInteger: "whole number",
          phone: "phone",
          email: "email",
          "text-short": "text",
          address: "address",
          requiredError: "Required",
          invalidFormatError: "Invalid format for {{inputType}}",
          minValueError: "Minimum is {{min}}",
          minLengthError: "Minimum {{min}} characters",
          maxValueError: "Maximum is {{max}}",
          maxLengthError: "Maximum is {{max}} characters",
        },
      },
      account: {
        heading: "My Account",
        introduction: "Hello, {{name}}",
        startFormButton: "START FORM",
        logoutButton: "LOGOUT",
      },
    },
    zh: {
      common: {
        validatedInput: {
          id: "用户名",
          password: "密码",
          nonNegativeInteger: "整数",
          phone: "电话号码",
          email: "邮箱",
          "text-short": "文字",
          address: "地址",
          requiredError: "必填",
          invalidFormatError: "不符合{{inputType}}格式",
          minValueError: "不能少于{{min}}",
          minLengthError: "最少{{min}}个字",
          maxValueError: "不能大于{{max}}",
          maxLengthError: "最多{{max}}个字",
        },
      },
      account: {
        heading: "我的账户",
        introduction: "{{name}}， 你好！",
        startFormButton: "开始调查",
        logoutButton: "退出",
      },
    },
    // have a initial namespace
    ns: ["account"],
    defaultNS: "account",
    debug: true,
    interpolation: {
      escapeValue: false, // not needed for react
    },
  },
});
export default i18n;
