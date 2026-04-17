import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";

import { Button } from "./button";
import type { VideoPlayerHandle } from "./video-player";
import { VideoPlayer } from "./video-player";

/** Short CC0 clip for Storybook (MDN sample). */
const SAMPLE_SRC = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm";

/** Public WebVTT sample for captions story. */
const SAMPLE_CAPTIONS_VTT =
  "https://raw.githubusercontent.com/mozilla/butter/master/tests/tracks/captions/house_captions_en.vtt";

const meta = {
  title: "Primitives/VideoPlayer",
  component: VideoPlayer,
  tags: ["autodocs"],
  args: {
    controls: true,
    playsInline: true,
    preload: "metadata" as const,
    src: SAMPLE_SRC,
    "aria-label": "Sample lesson video",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Token-aware native video wrapper: progress throttling, session play tracking, watched-threshold callback, captions tracks, and inline error/buffering affordances. Use **keyboard** with native controls (focus the video, Space toggles play/pause).",
      },
    },
  },
} satisfies Meta<typeof VideoPlayer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPoster: Story = {
  args: {
    poster: "https://interactive-examples.mdn.mozilla.net/media/cc0-images/flowers.jpg",
  },
};

export const PlayAndPause: Story = {
  name: "Play / pause (native controls)",
  render: (args) => {
    const ref = useRef<VideoPlayerHandle | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: 720 }}>
        <VideoPlayer {...args} ref={ref} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const v = ref.current?.getVideoElement();
              if (!v) {
                return;
              }
              void (v.paused ? v.play() : v.pause());
            }}
          >
            Toggle play via API
          </Button>
          <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Or use on-video controls / Space when focused.
          </span>
        </div>
      </div>
    );
  },
};

export const WithCaptions: Story = {
  args: {
    src: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    captions: [
      {
        src: SAMPLE_CAPTIONS_VTT,
        label: "English",
        srclang: "en",
        isDefault: true,
      },
    ],
    "aria-label": "Video: Big Buck Bunny with English captions",
  },
};

export const ErrorState: Story = {
  args: {
    src: "https://example.invalid/lms-missing-video.mp4",
    unavailableMessage: "This URL cannot be loaded (expected in this story).",
  },
};

export const WatchedThreshold: Story = {
  render: (args) => {
    const [fired, setFired] = useState(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: 720 }}>
        <VideoPlayer
          {...args}
          watchedThreshold={0.25}
          onWatchedThresholdReached={() => setFired(true)}
        />
        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)" }}>
          Threshold set to <strong>25%</strong> for quick demo. Fired:{" "}
          <strong>{fired ? "yes" : "no"}</strong>.
        </p>
      </div>
    );
  },
};
