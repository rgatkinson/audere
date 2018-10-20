// See https://github.com/facebook/react-native/issues/9599
const scope: any = global;
if (scope && typeof scope.self === "undefined") {
  scope.self = scope;
}
