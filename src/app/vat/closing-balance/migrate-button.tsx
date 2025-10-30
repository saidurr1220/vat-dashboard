"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Database } from "lucide-react";

export default function MigrateButton() {
  const [migrating, setMigrating] = useState(false);

  const handleMigrate = async () => {
    if (
      !confirm(
        "This will migrate your existing closing balance data to the new bank statement format. Continue?"
      )
    ) {
      return;
    }

    setMigrating(true);
    try {
      const response = await fetch("/api/vat/closing-balance/migrate", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Migration successful! Processed ${result.recordsProcessed} records.`
        );
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Migration failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Migration error:", error);
      alert("Migration failed. Please check the console for details.");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleMigrate}
      disabled={migrating}
      className="gap-2"
    >
      {migrating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Migrating...
        </>
      ) : (
        <>
          <Database className="w-4 h-4" />
          Migrate Data
        </>
      )}
    </Button>
  );
}
