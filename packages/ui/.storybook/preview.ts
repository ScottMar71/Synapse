import type { Preview } from "@storybook/react";

import "@conductor/design-tokens/tokens.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
