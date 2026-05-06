import { describe, expect, it } from "vitest";

import { convertCaseVariants } from "./caseConverter";

describe("convertCaseVariants", () => {
  it("fans out a plain phrase into common case variants", () => {
    expect(convertCaseVariants("hello world")).toEqual({
      lowercase: "hello world",
      uppercase: "HELLO WORLD",
      camelCase: "helloWorld",
      pascalCase: "HelloWorld",
      snakeCase: "hello_world",
      kebabCase: "hello-world",
      constantCase: "HELLO_WORLD",
      dotCase: "hello.world",
      pathCase: "hello/world",
      sentenceCase: "Hello world",
      headerCase: "Hello-World",
    });
  });

  it("normalizes punctuation-heavy and mixed-style input predictably", () => {
    expect(convertCaseVariants("__hello-world.testValue HTTPStatus200!!")).toEqual({
      lowercase: "hello world test value http status 200",
      uppercase: "HELLO WORLD TEST VALUE HTTP STATUS 200",
      camelCase: "helloWorldTestValueHttpStatus200",
      pascalCase: "HelloWorldTestValueHttpStatus200",
      snakeCase: "hello_world_test_value_http_status_200",
      kebabCase: "hello-world-test-value-http-status-200",
      constantCase: "HELLO_WORLD_TEST_VALUE_HTTP_STATUS_200",
      dotCase: "hello.world.test.value.http.status.200",
      pathCase: "hello/world/test/value/http/status/200",
      sentenceCase: "Hello world test value http status 200",
      headerCase: "Hello-World-Test-Value-Http-Status-200",
    });
  });

  it("returns empty variants for empty input", () => {
    expect(convertCaseVariants("   \n\t  ")).toEqual({
      lowercase: "",
      uppercase: "",
      camelCase: "",
      pascalCase: "",
      snakeCase: "",
      kebabCase: "",
      constantCase: "",
      dotCase: "",
      pathCase: "",
      sentenceCase: "",
      headerCase: "",
    });
  });
});
