/**
 * mammoth 的浏览器入口（mammoth/mammoth.browser）没有自带类型声明，
 * 这里按本项目用到的最小 API 补充。
 */

declare module "mammoth/mammoth.browser" {
  interface MammothImage {
    contentType: string;
    readAsBase64String: () => Promise<string>;
  }

  interface MammothResult {
    value: string;
    messages: unknown[];
  }

  interface ConvertOptions {
    convertImage?: unknown;
  }

  const mammoth: {
    convertToHtml: (
      input: { arrayBuffer: ArrayBuffer },
      options?: ConvertOptions
    ) => Promise<MammothResult>;
    images: {
      imgElement: (
        converter: (
          image: MammothImage
        ) => Promise<{ src: string }> | { src: string }
      ) => unknown;
    };
  };

  export = mammoth;
}
