import { Suspense } from "react";
import { InviteAcceptClient } from "./InviteAcceptClient";
import { InviteShell } from "./InviteShell";

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<InviteShell message="Davet hazırlanıyor..." />}>
      <InviteAcceptClient />
    </Suspense>
  );
}
