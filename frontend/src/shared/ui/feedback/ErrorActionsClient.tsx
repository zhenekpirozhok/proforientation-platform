"use client";

import { Button } from "antd";

type Action = {
  label: string;
  onClick: () => void;
  type?: "primary" | "default";
};

export function ErrorActionsClient({
  primary,
  secondary,
}: {
  primary?: Action;
  secondary?: Action;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {primary ? (
        <Button
          type={primary.type ?? "primary"}
          size="large"
          className="rounded-2xl"
          onClick={primary.onClick}
        >
          {primary.label}
        </Button>
      ) : null}

      {secondary ? (
        <Button
          size="large"
          className="rounded-2xl"
          onClick={secondary.onClick}
        >
          {secondary.label}
        </Button>
      ) : null}
    </div>
  );
}
