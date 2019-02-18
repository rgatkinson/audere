if (process.env.NODE_ENV !== "test") {
  require("react-native-get-random-values");
}

// See https://github.com/facebook/react-native/issues/9599
const scope: any = global;
if (scope && typeof scope.self === "undefined") {
  scope.self = scope;
}
