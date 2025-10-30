"use client";

import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast-helpers";

export default function ToastDemo() {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={() => showToast.success("Operation completed successfully!")}
        variant="default"
      >
        Success Toast
      </Button>

      <Button
        onClick={() => showToast.error("Something went wrong!")}
        variant="destructive"
      >
        Error Toast
      </Button>

      <Button
        onClick={() => showToast.warning("Please check your input")}
        variant="outline"
      >
        Warning Toast
      </Button>

      <Button
        onClick={() => showToast.info("Here's some helpful information")}
        variant="secondary"
      >
        Info Toast
      </Button>
    </div>
  );
}
