import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageThread } from "@/components/chat/message-thread";
import { participant } from "@/components/chat/participant";
import { requireSession } from "@/lib/auth";
import { firstNameOf } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const profile = await requireSession();
  if (profile.role === "admin") redirect("/admin/messages");

  const store = getStore();
  const conversation = await store.getOrCreateConversation(profile.id);
  const [messages, profiles] = await Promise.all([store.listMessages(conversation.id), store.listProfiles()]);
  const admins = profiles.filter((p) => p.role === "admin");
  const participants = Object.fromEntries([profile, ...admins].map((p) => [p.id, participant(p)]));
  const studio = admins[0] ? firstNameOf(admins[0].fullName) ?? "Melanie" : "Melanie";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="eyebrow">Messages</p>
        <h1 className="display mt-3 text-3xl sm:text-4xl">Talk to {studio}.</h1>
        <p className="mt-2 hidden text-sm leading-relaxed text-bone-dim sm:block">
          Questions, feedback, quick decisions — send them here and you&apos;ll get a reply in the portal and a heads-up by email.
        </p>
      </header>
      <MessageThread
        conversationId={conversation.id}
        me={participant(profile)}
        participants={participants}
        initialMessages={messages}
        placeholder={`Message ${studio}…`}
        emptyTitle="Say hello"
        emptyHint={`Send ${studio} a note about the project — anything from a quick question to feedback on a design round.`}
        className="h-[calc(100dvh-15rem)] min-h-[20rem] sm:h-[calc(100dvh-19rem)]"
      />
    </div>
  );
}
